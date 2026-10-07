import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { addDatabaseChangeListener, useSQLiteContext } from "expo-sqlite";
import { Colors } from "../../constants/colors";
import ClientVehicleCard from "../../components/clientvehiclecard";
import { getVehiclesAvailableForRange } from "../../services/database";

const FILTERS = ["All", "Available"];

function dateInputValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toLocalDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 9);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

export default function ClientVehicles() {
  const db = useSQLiteContext();
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState("");
  const [errorRange, setErrorRange] = useState("");
  const [loadedRange, setLoadedRange] = useState("");
  const [pickupDate, setPickupDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return dateInputValue(date);
  });
  const [returnDate, setReturnDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return dateInputValue(date);
  });
  const [activeFilter, setActiveFilter] = useState("All");
  const pickup = toLocalDate(pickupDate);
  const returned = toLocalDate(returnDate);
  const validRange = Boolean(pickup && returned && returned > pickup && pickup >= new Date(new Date().setHours(0, 0, 0, 0)));
  const rangeKey = `${pickupDate}|${returnDate}`;
  const isLoading = validRange && loadedRange !== rangeKey;
  const currentVehicles = loadedRange === rangeKey ? vehicles : [];
  const currentError = errorRange === rangeKey ? error : "";

  useEffect(() => {
    let isActive = true;
    const pickupValue = toLocalDate(pickupDate);
    const returnValue = toLocalDate(returnDate);
    if (!pickupValue || !returnValue || returnValue <= pickupValue ||
        pickupValue < new Date(new Date().setHours(0, 0, 0, 0))) {
      return () => {
        isActive = false;
      };
    }
    const loadAvailability = () => {
      getVehiclesAvailableForRange(db, pickupValue, returnValue)
        .then((rows) => {
          if (!isActive) return;
          setVehicles(rows);
          setError("");
          setErrorRange(rangeKey);
          setLoadedRange(rangeKey);
        })
        .catch((loadError) => {
          if (!isActive) return;
          setError(loadError?.message || "Vehicle availability could not be checked.");
          setErrorRange(rangeKey);
          setLoadedRange(rangeKey);
        });
    };
    const subscription = addDatabaseChangeListener((event) => {
      if (event.tableName === "bookings" || event.tableName === "vehicles") {
        loadAvailability();
      }
    });
    loadAvailability();
    return () => {
      isActive = false;
      subscription.remove();
    };
  }, [db, pickupDate, returnDate, rangeKey]);

  const filteredVehicles = currentVehicles.filter((vehicle) => {
    if (activeFilter === "All" || activeFilter === "Available") return true;
    return (vehicle.status || "").toUpperCase() === activeFilter.toUpperCase();
  });
  const availableCount = currentVehicles.length;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.eyebrow}>THE RENTTRACK COLLECTION</Text>
            <Text style={styles.title}>Choose your ride</Text>
          </View>
          <View style={styles.filterIcon}>
            <Ionicons name="options-outline" size={19} color={Colors.primary} />
          </View>
        </View>
        <Text style={styles.subtitle}>Live fleet availability and rates from RentTrack.</Text>
        <View style={styles.dateCard}>
          <Text style={styles.pulseLabel}>CHECK AVAILABILITY BY DATE</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>PICKUP · YYYY-MM-DD</Text>
              <TextInput
                value={pickupDate}
                onChangeText={setPickupDate}
                style={styles.dateInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.muted}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>RETURN · YYYY-MM-DD</Text>
              <TextInput
                value={returnDate}
                onChangeText={setReturnDate}
                style={styles.dateInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.muted}
                autoCapitalize="none"
              />
            </View>
          </View>
          {!validRange ? (
            <Text style={styles.dateError}>Choose a future pickup date and a later return date.</Text>
          ) : null}
        </View>
        <View style={styles.location}>
          <Ionicons name="location-outline" size={16} color={Colors.primary} />
          <Text style={styles.locationText}>Tagum City, Philippines</Text>
          <Ionicons name="chevron-down" size={13} color={Colors.muted} />
        </View>
        <View style={styles.pulse}>
          <View>
            <Text style={styles.pulseLabel}>DATE AVAILABILITY</Text>
            <Text style={styles.pulseText}>{availableCount} available for this rental period</Text>
          </View>
          <View style={styles.liveBadge}><Text style={styles.liveText}>● LIVE</Text></View>
        </View>
        <View style={styles.filters}>
          {FILTERS.map((filter) => {
            const active = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.results}>
          <Text style={styles.resultText}>AVAILABLE FOR SELECTED DATES</Text>
          <Text style={styles.resultCount}>{filteredVehicles.length} VEHICLES</Text>
        </View>
        {isLoading ? (
          <Text style={styles.message}>Loading the live fleet…</Text>
        ) : currentError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{currentError}</Text>
          </View>
        ) : filteredVehicles.length ? (
          filteredVehicles.map((vehicle) => (
            <ClientVehicleCard
              key={vehicle.id}
              vehicle={{
                ...vehicle,
                make: vehicle.brand,
                model: vehicle.name || vehicle.model,
                features: `${vehicle.vehicleType || "Vehicle"}  ·  ${vehicle.plateNumber || "Plate pending"}`,
              }}
              onBook={() =>
                router.push({
                  pathname: "/(client)/reserve",
                  params: {
                    vehicleId: String(vehicle.id),
                    pickupDate,
                    returnDate,
                  },
                })
              }
            />
          ))
        ) : (
          <Text style={styles.message}>
            {currentVehicles.length
              ? "No vehicles are free for the selected date range."
              : "No vehicles have been added to the fleet yet."}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 18, paddingTop: 23, paddingBottom: 32 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  eyebrow: { color: Colors.primary, fontSize: 8, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: Colors.white, fontSize: 24, fontWeight: "900", marginTop: 7 },
  subtitle: { color: Colors.muted, fontSize: 11, marginTop: 6 },
  dateCard: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 13, marginTop: 14 },
  dateRow: { flexDirection: "row", gap: 9, marginTop: 10 },
  dateField: { flex: 1 },
  dateLabel: { color: Colors.muted, fontSize: 7, fontWeight: "800", marginBottom: 6 },
  dateInput: { minHeight: 42, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 9, color: Colors.white, backgroundColor: Colors.surface, fontSize: 10 },
  dateError: { color: Colors.warning, fontSize: 9, marginTop: 7 },
  filterIcon: { width: 40, height: 40, backgroundColor: Colors.surface, borderRadius: 11, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  location: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginTop: 16 },
  locationText: { color: Colors.white, fontSize: 10, fontWeight: "600" },
  pulse: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, marginTop: 14 },
  pulseLabel: { color: Colors.primary, fontSize: 8, fontWeight: "800", letterSpacing: 0.8 },
  pulseText: { color: Colors.white, fontSize: 14, fontWeight: "800", marginTop: 5 },
  liveBadge: { backgroundColor: "#183622", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 6 },
  liveText: { color: Colors.primary, fontSize: 8, fontWeight: "800" },
  filters: { flexDirection: "row", gap: 7, marginTop: 14, marginBottom: 20, flexWrap: "wrap" },
  filterChip: { borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { color: Colors.muted, fontSize: 10 },
  filterTextActive: { color: Colors.background, fontWeight: "800" },
  results: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  resultText: { color: "#D7E4DB", fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  resultCount: { color: Colors.muted, fontSize: 8, letterSpacing: 0.7 },
  message: { color: Colors.muted, fontSize: 11, textAlign: "center", paddingVertical: 30 },
  errorBox: { padding: 14, borderRadius: 10, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  errorText: { color: Colors.warning, fontSize: 11, textAlign: "center" },
});
