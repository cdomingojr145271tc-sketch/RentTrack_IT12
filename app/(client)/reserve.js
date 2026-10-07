import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { addDatabaseChangeListener, useSQLiteContext } from "expo-sqlite";
import { Colors } from "../../constants/colors";
import useFleetVehicles from "../../hooks/useFleetVehicles";
import {
  createClientBooking,
  getCurrentClient,
  getVehiclesAvailableForRange,
} from "../../services/database";
import { calculateRentalQuote, DISTANCE_RATE_PER_KM } from "../../services/pricing";

function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 9);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

export default function ClientReserve() {
  const params = useLocalSearchParams();
  const vehicleId = Array.isArray(params.vehicleId) ? params.vehicleId[0] : params.vehicleId;
  const pickupParam = Array.isArray(params.pickupDate) ? params.pickupDate[0] : params.pickupDate;
  const returnParam = Array.isArray(params.returnDate) ? params.returnDate[0] : params.returnDate;
  const db = useSQLiteContext();
  const { vehicles } = useFleetVehicles();
  const [client, setClient] = useState(null);
  const [destination, setDestination] = useState("");
  const [distanceValue, setDistanceValue] = useState("");
  const [pickupDate, setPickupDate] = useState(pickupParam || "");
  const [returnDate, setReturnDate] = useState(returnParam || "");
  const [isSaving, setIsSaving] = useState(false);
  const [availableVehicle, setAvailableVehicle] = useState(null);
  const [availableRangeKey, setAvailableRangeKey] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const pickup = parseDate(pickupDate);
  const returned = parseDate(returnDate);
  const rangeKey = `${pickupDate}|${returnDate}`;
  const validDateRange = Boolean(
    pickup &&
    returned &&
    returned > pickup &&
    pickup >= new Date(new Date().setHours(0, 0, 0, 0))
  );
  useEffect(() => {
    let isActive = true;
    getCurrentClient(db)
      .then((profile) => {
        if (isActive) setClient(profile);
      })
      .catch((error) => {
        if (isActive) setAvailabilityError(error?.message || "Your client profile could not be loaded.");
      });
    return () => {
      isActive = false;
    };
  }, [db]);

  useEffect(() => {
    let isActive = true;
    const availabilityPickup = parseDate(pickupDate);
    const availabilityReturn = parseDate(returnDate);
    if (!vehicleId || !availabilityPickup || !availabilityReturn ||
        availabilityReturn <= availabilityPickup ||
        availabilityPickup < new Date(new Date().setHours(0, 0, 0, 0))) {
      return () => {
        isActive = false;
      };
    }

    const loadAvailability = async () => {
      setAvailabilityLoading(true);
      try {
        const rows = await getVehiclesAvailableForRange(
          db,
          availabilityPickup,
          availabilityReturn
        );
        if (!isActive) return;
        const selected = rows.find((item) => item.id === Number(vehicleId)) || null;
        setAvailableVehicle(selected);
        setAvailableRangeKey(rangeKey);
        setAvailabilityError(
          selected ? "" : "This vehicle is already booked or unavailable for these dates."
        );
      } catch (error) {
        if (isActive) {
          setAvailableVehicle(null);
          setAvailableRangeKey(rangeKey);
          setAvailabilityError(error?.message || "Vehicle availability could not be checked.");
        }
      } finally {
        if (isActive) setAvailabilityLoading(false);
      }
    };
    const subscription = addDatabaseChangeListener((event) => {
      if (event.tableName === "bookings" || event.tableName === "vehicles") {
        void loadAvailability();
      }
    });
    void loadAvailability();
    return () => {
      isActive = false;
      subscription.remove();
    };
  }, [db, vehicleId, pickupDate, returnDate, rangeKey]);

  const availableVehicleForRange =
    validDateRange && availableRangeKey === rangeKey ? availableVehicle : null;
  const isCheckingAvailability =
    validDateRange && (availabilityLoading || availableRangeKey !== rangeKey);
  const vehicle = availableVehicleForRange || vehicles.find((item) => item.id === Number(vehicleId));
  const rentalDays = pickup && returned && returned > pickup
    ? Math.ceil((returned - pickup) / (24 * 60 * 60 * 1000))
    : 0;
  const distanceKm = Number(distanceValue);
  const distanceValid = distanceValue.trim() !== "" && Number.isFinite(distanceKm) && distanceKm > 0;
  const quote = vehicle
    ? calculateRentalQuote(
        vehicle.price,
        rentalDays,
        distanceValid ? distanceKm : 0,
        DISTANCE_RATE_PER_KM
      )
    : { baseAmount: 0, distanceAmount: 0, totalAmount: 0 };
  const { baseAmount, distanceAmount } = quote;

  const saveReservation = async () => {
    if (!client) {
      Alert.alert("Profile unavailable", "Your client profile could not be loaded. Return to the account screen and try again.");
      return;
    }
    if (!availableVehicleForRange) {
      Alert.alert("Vehicle unavailable", availabilityError || "This vehicle is not available for the selected dates.");
      return;
    }
    if (!pickup || !returned || !rentalDays || pickup < new Date(new Date().setHours(0, 0, 0, 0))) {
      Alert.alert("Check rental dates", "Choose a valid future pickup date and a later return date.");
      return;
    }
    if (!destination.trim()) {
      Alert.alert("Destination required", "Enter your destination to estimate the distance charge.");
      return;
    }
    if (!distanceValid) {
      Alert.alert("Distance required", "Enter the one-way road distance in kilometers.");
      return;
    }

    setIsSaving(true);
    try {
      const booking = await createClientBooking(db, client.id, vehicle.id, {
        destination: destination.trim(),
        destinationKm: distanceKm,
        distanceRatePerKm: DISTANCE_RATE_PER_KM,
        pickupAt: pickup,
        returnAt: returned,
      });
      Alert.alert(
        "Reservation requested",
        `${booking.bookingCode} · ${booking.vehicleName}\n${booking.destination} · ${booking.destinationKm} km\n${booking.rentalDays} days · ${pickupDate} to ${returnDate}\nStatus: Pending admin review\nEstimated total: ₱${booking.totalAmount.toLocaleString()}`,
        [{ text: "View my trips", onPress: () => router.replace("/(client)/bookings") }]
      );
    } catch (error) {
      Alert.alert("Could not reserve this vehicle", error?.message || "Please review your details and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back to vehicles</Text>
        </TouchableOpacity>
        <Text style={styles.eyebrow}>YOUR RENTTRACK RESERVATION</Text>
        <Text style={styles.title}>Where are you headed?</Text>
        <Text style={styles.subtitle}>Tell us your destination so your estimate includes the distance fee.</Text>

        {isCheckingAvailability ? (
          <Text style={styles.helper}>Checking availability for the selected dates…</Text>
        ) : availableRangeKey === rangeKey && availabilityError ? (
          <Text style={styles.error}>{availabilityError}</Text>
        ) : null}

        {vehicle ? (
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleIcon}><Ionicons name="car-sport" size={24} color={Colors.primary} /></View>
            <View style={styles.vehicleCopy}>
              <Text style={styles.vehicleName}>{vehicle.brand} {vehicle.name || vehicle.model}</Text>
              <Text style={styles.dailyRate}>₱{Number(vehicle.price).toLocaleString()} per day · {rentalDays || "—"} days</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.loading}>Loading vehicle details…</Text>
        )}

        <Text style={styles.fieldLabel}>PICKUP DATE · YYYY-MM-DD</Text>
        <TextInput
          value={pickupDate}
          onChangeText={setPickupDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.muted}
          style={styles.input}
          autoCapitalize="none"
        />
        <Text style={styles.fieldLabel}>RETURN DATE · YYYY-MM-DD</Text>
        <TextInput
          value={returnDate}
          onChangeText={setReturnDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.muted}
          style={styles.input}
          autoCapitalize="none"
        />
        <Text style={styles.fieldLabel}>DESTINATION</Text>
        <TextInput
          value={destination}
          onChangeText={setDestination}
          placeholder="e.g. Tagaytay, Cavite"
          placeholderTextColor={Colors.muted}
          style={styles.input}
        />
        <Text style={styles.fieldLabel}>ONE-WAY ROAD DISTANCE (KM)</Text>
        <TextInput
          value={distanceValue}
          onChangeText={setDistanceValue}
          placeholder="e.g. 65"
          placeholderTextColor={Colors.muted}
          style={styles.input}
          keyboardType="decimal-pad"
        />
        <Text style={styles.helper}>Estimate the road distance from the RentTrack pickup branch to your destination.</Text>

        <View style={styles.quote}>
          <Text style={styles.quoteHeading}>ESTIMATED TOTAL</Text>
          <View style={styles.line}>
            <Text style={styles.lineLabel}>Vehicle rental · {rentalDays || 0} days</Text>
            <Text style={styles.lineValue}>₱{baseAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.line}>
            <Text style={styles.lineLabel}>Distance fee · {distanceValid ? distanceKm : 0} km × ₱{DISTANCE_RATE_PER_KM}</Text>
            <Text style={styles.lineValue}>₱{distanceAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.line}>
            <Text style={styles.totalLabel}>Estimated total</Text>
            <Text style={styles.total}>₱{quote.totalAmount.toLocaleString()}</Text>
          </View>
          <Text style={styles.formula}>Daily rate × selected rental days + one-way destination km × ₱{DISTANCE_RATE_PER_KM}/km. Request remains pending until admin confirmation.</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, isSaving && styles.disabled]}
          disabled={isSaving || !vehicle || !availableVehicleForRange || isCheckingAvailability || !client}
          onPress={saveReservation}
        >
          <Text style={styles.buttonText}>{isSaving ? "Saving reservation…" : "Request reservation"}</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.background} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 19, paddingTop: 20, paddingBottom: 35 },
  back: { alignSelf: "flex-start", marginBottom: 27 },
  backText: { color: Colors.primary, fontSize: 11 },
  eyebrow: { color: Colors.primary, fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  title: { color: Colors.white, fontSize: 24, lineHeight: 30, fontWeight: "900", marginTop: 7 },
  subtitle: { color: Colors.muted, fontSize: 10, lineHeight: 15, marginTop: 6 },
  vehicleCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 13, marginTop: 18 },
  vehicleIcon: { width: 42, height: 42, borderRadius: 11, backgroundColor: "#192D20", justifyContent: "center", alignItems: "center" },
  vehicleCopy: { flex: 1, marginLeft: 11 },
  vehicleName: { color: Colors.white, fontSize: 12, fontWeight: "800" },
  dailyRate: { color: Colors.muted, fontSize: 9, marginTop: 4 },
  fieldLabel: { color: "#B9C8C1", fontSize: 9, fontWeight: "800", letterSpacing: 0.6, marginTop: 20, marginBottom: 8 },
  input: { height: 48, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 9, paddingHorizontal: 13, color: Colors.white, fontSize: 12 },
  helper: { color: Colors.muted, fontSize: 9, lineHeight: 14, marginTop: 7 },
  error: { color: Colors.danger, fontSize: 9, lineHeight: 14, marginTop: 12 },
  quote: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 13, padding: 14, marginTop: 21 },
  quoteHeading: { color: Colors.primary, fontSize: 9, fontWeight: "800", letterSpacing: 0.8, marginBottom: 10 },
  line: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 6 },
  lineLabel: { color: "#C0CEC5", fontSize: 9, flex: 1 },
  lineValue: { color: "#C0CEC5", fontSize: 10 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 11 },
  totalLabel: { color: Colors.white, fontSize: 11, fontWeight: "700" },
  total: { color: Colors.primary, fontSize: 17, fontWeight: "900" },
  formula: { color: Colors.muted, fontSize: 8, lineHeight: 13, marginTop: 10 },
  button: { height: 49, backgroundColor: Colors.primary, borderRadius: 9, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 17 },
  disabled: { opacity: 0.65 },
  buttonText: { color: Colors.background, fontSize: 11, fontWeight: "900" },
  loading: { color: Colors.muted, paddingVertical: 20 },
});
