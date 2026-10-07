import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { addDatabaseChangeListener, useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Colors } from "../../constants/colors";
import ClientVehicleCard from "../../components/clientvehiclecard";
import {
  getBookingsForCustomer,
  getCurrentClient,
  getVehiclesAvailableForRange,
} from "../../services/database";

function dateInputValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function ClientHome() {
  const db = useSQLiteContext();
  const [client, setClient] = useState(null);
  const [nextBooking, setNextBooking] = useState(null);
  const [featuredVehicles, setFeaturedVehicles] = useState([]);
  const [bookingError, setBookingError] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");
  const [rentalRange] = useState(() => {
    const pickup = new Date();
    pickup.setDate(pickup.getDate() + 1);
    pickup.setHours(9, 0, 0, 0);
    const returned = new Date(pickup);
    returned.setDate(returned.getDate() + 2);
    return {
      pickup,
      returned,
      pickupDate: dateInputValue(pickup),
      returnDate: dateInputValue(returned),
    };
  });
  const clientName = client?.name || "RentTrack client";
  const initials = clientName
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    let isActive = true;
    const loadBookings = async () => {
      try {
        const currentClient = await getCurrentClient(db);
        if (!currentClient) throw new Error("The active client profile could not be found.");
        const bookings = await getBookingsForCustomer(db, currentClient.id);
        if (!isActive) return;
        const upcoming = bookings
          .filter((booking) => ["PENDING", "RESERVED", "ACTIVE"].includes(booking.status))
          .sort((a, b) => new Date(a.pickupAt) - new Date(b.pickupAt));
        setClient(currentClient);
        setNextBooking(upcoming[0] || null);
        setBookingError("");
      } catch (error) {
        if (isActive) setBookingError(error?.message || "Your trips could not be loaded.");
      }
    };
    const subscription = addDatabaseChangeListener((event) => {
      if (["bookings", "customers", "client_session"].includes(event.tableName)) {
        void loadBookings();
      }
    });
    void loadBookings();
    return () => {
      isActive = false;
      subscription.remove();
    };
  }, [db]);

  useEffect(() => {
    let isActive = true;
    const loadAvailability = async () => {
      try {
        const rows = await getVehiclesAvailableForRange(
          db,
          rentalRange.pickup,
          rentalRange.returned
        );
        if (!isActive) return;
        setFeaturedVehicles(rows.slice(0, 2).map((vehicle) => ({
          ...vehicle,
          make: vehicle.brand,
          model: vehicle.name || vehicle.model,
          features: `${vehicle.vehicleType || "Vehicle"} · ${vehicle.plateNumber || "Plate pending"}`,
        })));
        setAvailabilityError("");
      } catch (error) {
        if (isActive) setAvailabilityError(error?.message || "Vehicle availability could not be checked.");
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
  }, [db, rentalRange]);

  const pickupLabel = (booking) => {
    const date = new Date(booking.pickupAt);
    return `${date.toLocaleDateString("en-PH", { month: "short", day: "numeric" })} · ${date.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}`;
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>RENT<Text style={styles.brandAccent}>TRACK</Text></Text>
            <Text style={styles.eyebrow}>YOUR PERSONAL GARAGE</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={() => router.push("/(client)/account")}>
            <Text style={styles.avatarText}>{initials || "RT"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.welcome}>
          <Text style={styles.greeting}>Welcome, {clientName.split(" ")[0]}</Text>
          <Text style={styles.subGreeting}>Where would you like to go?</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroLabel}>
              <Ionicons name="sparkles" size={13} color={Colors.primary} />
              <Text style={styles.heroLabelText}>MADE FOR THE OPEN ROAD</Text>
            </View>
            <Ionicons name="navigate-circle" size={27} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Find your{"\n"}next ride.</Text>
          <Text style={styles.heroCopy}>Comfortable rides. Clear pricing. More places to explore.</Text>
          <TouchableOpacity style={styles.heroButton} onPress={() => router.push("/(client)/vehicles")}>
            <Text style={styles.heroButtonText}>Explore vehicles</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.background} />
          </TouchableOpacity>
          <Ionicons name="car-sport" size={146} color="#31533A" style={styles.heroCar} />
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push("/(client)/vehicles")}>
            <View style={styles.actionIcon}><Ionicons name="car-outline" size={20} color={Colors.primary} /></View>
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>Browse rides</Text>
              <Text style={styles.actionSub}>Find a vehicle</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push("/scan")}>
            <View style={styles.actionIcon}><Ionicons name="scan-outline" size={20} color={Colors.primary} /></View>
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>Scan a QR code</Text>
              <Text style={styles.actionSub}>Pick up your rental</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>HAND-PICKED FOR YOU</Text>
            <Text style={styles.sectionSub}>
              Available {rentalRange.pickupDate} – {rentalRange.returnDate}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(client)/vehicles")}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredList}>
          {featuredVehicles.map((vehicle) => (
            <ClientVehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              compact
              onBook={() =>
                router.push({
                  pathname: "/(client)/reserve",
                  params: {
                    vehicleId: String(vehicle.id),
                    pickupDate: rentalRange.pickupDate,
                    returnDate: rentalRange.returnDate,
                  },
                })
              }
            />
          ))}
          {!featuredVehicles.length && (
            <Text style={styles.noVehicles}>
              {availabilityError || "No vehicles available for these dates."}
            </Text>
          )}
        </ScrollView>

        <View style={styles.tripCard}>
          <View style={styles.tripIcon}><Ionicons name="calendar" size={19} color={Colors.primary} /></View>
          <View style={styles.tripText}>
            <Text style={styles.tripTitle}>
              {bookingError
                ? "Trips unavailable"
                : nextBooking?.status === "PENDING"
                  ? "Awaiting confirmation"
                  : nextBooking
                    ? "Coming up next"
                    : "No upcoming trips"}
            </Text>
            <Text style={styles.tripDetail}>
              {bookingError || (nextBooking
                ? `${nextBooking.vehicleName} · ${pickupLabel(nextBooking)}`
                : "Reserve a vehicle to see your trip here.")}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(client)/bookings")}>
            <Ionicons name="arrow-forward-circle-outline" size={25} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 19, paddingTop: 19, paddingBottom: 32 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { color: Colors.white, fontSize: 18, fontWeight: "900", letterSpacing: 1.4 },
  brandAccent: { color: Colors.primary },
  eyebrow: { color: Colors.muted, fontSize: 8, letterSpacing: 1.3, marginTop: 3 },
  avatar: { width: 39, height: 39, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  avatarText: { color: Colors.primary, fontWeight: "800", fontSize: 11 },
  welcome: { marginTop: 25, marginBottom: 16 },
  greeting: { color: Colors.white, fontSize: 23, fontWeight: "800" },
  subGreeting: { color: Colors.muted, fontSize: 12, marginTop: 5 },
  hero: { backgroundColor: "#14291B", borderRadius: 18, padding: 19, minHeight: 222, overflow: "hidden" },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroLabel: { flexDirection: "row", alignItems: "center", gap: 7 },
  heroLabelText: { color: "#C8D8CB", fontSize: 8, fontWeight: "800", letterSpacing: 1.1 },
  heroTitle: { color: Colors.white, fontSize: 30, lineHeight: 33, fontWeight: "900", marginTop: 15 },
  heroCopy: { color: "#A4B5A8", fontSize: 10, lineHeight: 16, width: "69%", marginTop: 8 },
  heroButton: { flexDirection: "row", alignItems: "center", gap: 9, alignSelf: "flex-start", backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 12, height: 37, marginTop: 14, zIndex: 1 },
  heroButtonText: { color: Colors.background, fontWeight: "800", fontSize: 10 },
  heroCar: { position: "absolute", right: -29, bottom: 12, opacity: 0.43, transform: [{ rotate: "-8deg" }] },
  quickActions: { marginTop: 14, gap: 9 },
  quickAction: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12 },
  actionIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: "#182B1E", alignItems: "center", justifyContent: "center" },
  actionCopy: { flex: 1, marginLeft: 11 },
  actionTitle: { color: Colors.white, fontSize: 11, fontWeight: "700" },
  actionSub: { color: Colors.muted, fontSize: 9, marginTop: 4 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 25, marginBottom: 12 },
  sectionTitle: { color: "#D7E4DB", fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  sectionSub: { color: Colors.muted, fontSize: 10, marginTop: 5 },
  seeAll: { color: Colors.primary, fontSize: 10, fontWeight: "700" },
  featuredList: { paddingRight: 20 },
  noVehicles: { color: Colors.muted, fontSize: 10, paddingVertical: 18 },
  tripCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, padding: 13, borderRadius: 12, marginTop: 19 },
  tripIcon: { width: 39, height: 39, borderRadius: 11, backgroundColor: "#192D20", alignItems: "center", justifyContent: "center" },
  tripText: { flex: 1, marginLeft: 11 },
  tripTitle: { color: Colors.white, fontSize: 11, fontWeight: "700" },
  tripDetail: { color: Colors.muted, fontSize: 9, marginTop: 4 },
});
