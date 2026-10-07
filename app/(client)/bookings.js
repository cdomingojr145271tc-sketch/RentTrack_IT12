import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { addDatabaseChangeListener, useSQLiteContext } from "expo-sqlite";
import { Colors } from "../../constants/colors";
import {
  getBookingsForCustomer,
  getCurrentClient,
  updateBookingStatus,
} from "../../services/database";

function formatDate(value) {
  const date = new Date(value);
  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ClientBookings() {
  const db = useSQLiteContext();
  const [client, setClient] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;
    const loadBookings = () => {
      getCurrentClient(db)
        .then((currentClient) => {
          if (!currentClient) throw new Error("The active client profile could not be found.");
          return getBookingsForCustomer(db, currentClient.id).then((rows) => ({
            currentClient,
            rows,
          }));
        })
        .then(({ currentClient, rows }) => {
          if (!isActive) return;
          setClient(currentClient);
          setBookings(rows);
          setError("");
        })
        .catch((loadError) => {
          if (isActive) setError(loadError?.message || "Your trips could not be loaded.");
        })
        .finally(() => {
          if (isActive) setIsLoading(false);
        });
    };
    const subscription = addDatabaseChangeListener((event) => {
      if (["bookings", "payments", "vehicles", "customers", "client_session"].includes(event.tableName)) {
        loadBookings();
      }
    });
    loadBookings();
    return () => {
      isActive = false;
      subscription.remove();
    };
  }, [db]);

  const upcomingCount = bookings.filter((booking) =>
    ["PENDING", "RESERVED", "ACTIVE"].includes(booking.status)
  ).length;
  const completedCount = bookings.filter((booking) => booking.status === "COMPLETED").length;

  const cancelPendingRequest = (booking) => {
    Alert.alert(
      "Cancel booking request?",
      `${booking.bookingCode} will be cancelled and the requested dates will be available again.`,
      [
        { text: "Keep request", style: "cancel" },
        {
          text: "Cancel request",
          style: "destructive",
          onPress: async () => {
            try {
              await updateBookingStatus(db, booking.id, "CANCELLED");
            } catch (cancelError) {
              Alert.alert("Could not cancel request", cancelError?.message || "Please try again.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>YOUR ROAD AHEAD</Text>
        <Text style={styles.title}>My trips</Text>
        <Text style={styles.subtitle}>
          {client
            ? `Reservations for ${client.name}, shared with the RentTrack team.`
            : "Your reservations are shared with the RentTrack team."}
        </Text>

        <View style={styles.statusRow}>
          <View style={styles.statusCard}>
            <Text style={styles.statusValue}>{String(upcomingCount).padStart(2, "0")}</Text>
            <Text style={styles.statusLabel}>UPCOMING</Text>
          </View>
          <View style={styles.statusCard}>
            <Text style={styles.statusValue}>{String(completedCount).padStart(2, "0")}</Text>
            <Text style={styles.statusLabel}>COMPLETED</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>YOUR RESERVATIONS</Text>
          <Text style={styles.bookingCount}>{bookings.length} TOTAL</Text>
        </View>

        {isLoading ? (
          <Text style={styles.message}>Loading your trips…</Text>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : bookings.length ? (
          bookings.map((booking) => {
            const active = ["RESERVED", "ACTIVE"].includes(booking.status);
            const badgeStyle = booking.status === "PENDING"
              ? styles.statusPending
              : booking.status === "REJECTED"
                ? styles.statusRejected
                : booking.status === "CANCELLED"
                  ? styles.statusRejected
                  : active
                    ? styles.statusActive
                    : styles.statusComplete;
            const badgeTextStyle = booking.status === "PENDING"
              ? styles.statusPendingText
              : booking.status === "REJECTED" || booking.status === "CANCELLED"
                ? styles.statusRejectedText
                : active
                  ? styles.statusActiveText
                  : styles.statusCompleteText;
            const displayStatus = booking.status === "RESERVED"
              ? "CONFIRMED"
              : booking.status === "ACTIVE"
                ? "RENTED"
                : booking.status === "COMPLETED"
                  ? "RETURNED"
                  : booking.status;
            return (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.vehicleArt}>
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateMonth}>
                      {new Date(booking.pickupAt).toLocaleDateString("en-PH", { month: "short" }).toUpperCase()}
                    </Text>
                    <Text style={styles.dateDay}>{new Date(booking.pickupAt).getDate()}</Text>
                  </View>
                  <Ionicons name="car-sport" size={100} color={Colors.primary} />
                  <Text style={styles.plate}>{booking.plateNumber || "PLATE PENDING"}</Text>
                </View>
                <View style={styles.bookingDetails}>
                  <View style={styles.bookingTopline}>
                    <Text style={styles.bookingCode}>{booking.bookingCode}</Text>
                    <View style={[styles.statusBadge, badgeStyle]}>
                      <Text style={[styles.statusText, badgeTextStyle]}>
                        {displayStatus}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.carName}>{booking.vehicleName}</Text>
                  {booking.status === "REJECTED" && booking.remarks ? (
                    <Text style={styles.rejectionReason}>Reason: {booking.remarks}</Text>
                  ) : null}
                  <View style={styles.detailLine}>
                    <Ionicons name="time-outline" size={15} color={Colors.primary} />
                    <Text style={styles.detailText}>{formatDate(booking.pickupAt)} — {formatDate(booking.returnAt)}</Text>
                  </View>
                  <View style={styles.detailLine}>
                    <Ionicons name="location-outline" size={15} color={Colors.primary} />
                    <Text style={styles.detailText}>
                      {booking.destination || "Destination not recorded"}
                      {Number(booking.destinationKm) > 0 ? ` · ${booking.destinationKm} km one way` : ""}
                    </Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>
                      Distance · {booking.destinationKm || 0} km × ₱{booking.distanceRatePerKm || 20}
                    </Text>
                    <Text style={styles.totalLabel}>
                      ₱{(Number(booking.destinationKm) * Number(booking.distanceRatePerKm || 20)).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>
                      {booking.status === "COMPLETED" ? "Final rental total" : "Estimated rental total"}
                    </Text>
                    <Text style={styles.totalPrice}>₱{Number(booking.totalAmount).toLocaleString()}</Text>
                  </View>
                  {Number(booking.paidAmount || 0) > 0 ? (
                    <>
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>
                          {booking.paymentStatus === "PAID" ? "Paid" : "Received"} · {booking.paymentMethod || "Payment"}
                        </Text>
                        <Text style={styles.totalLabel}>
                          ₱{Number(booking.paidAmount || 0).toLocaleString()}
                        </Text>
                      </View>
                      {Number(booking.totalAmount) > Number(booking.paidAmount || 0) ? (
                        <View style={styles.totalRow}>
                          <Text style={styles.totalLabel}>Remaining balance</Text>
                          <Text style={styles.totalPrice}>
                            ₱{(Number(booking.totalAmount) - Number(booking.paidAmount || 0)).toLocaleString()}
                          </Text>
                        </View>
                      ) : Number(booking.paidAmount || 0) > Number(booking.totalAmount) ? (
                        <View style={styles.totalRow}>
                          <Text style={styles.totalLabel}>Paid above final total</Text>
                          <Text style={styles.totalLabel}>
                            ₱{(Number(booking.paidAmount) - Number(booking.totalAmount)).toLocaleString()}
                          </Text>
                        </View>
                      ) : null}
                    </>
                  ) : (
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Payment status</Text>
                      <Text style={styles.totalLabel}>
                        {["RESERVED", "ACTIVE"].includes(booking.status)
                          ? "Awaiting checkout"
                          : booking.status === "PENDING"
                            ? "After admin confirmation"
                            : "Not paid"}
                      </Text>
                    </View>
                  )}
                </View>
                {booking.status === "PENDING" && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => cancelPendingRequest(booking)}
                  >
                    <Text style={styles.cancelText}>Cancel pending request</Text>
                  </TouchableOpacity>
                )}
                {booking.status === "RESERVED" && (
                  <TouchableOpacity style={styles.scanButton} onPress={() => router.push("/scan")}>
                    <Ionicons name="qr-code-outline" size={17} color={Colors.background} />
                    <Text style={styles.scanText}>Optional pickup QR</Text>
                    <Ionicons name="arrow-forward" size={15} color={Colors.background} />
                  </TouchableOpacity>
                )}
                {["RESERVED", "ACTIVE", "COMPLETED"].includes(booking.status) ? (
                  <TouchableOpacity
                    style={styles.paymentButton}
                    onPress={() =>
                      router.push({
                        pathname: "/booking/checkout",
                        params: { id: booking.bookingCode },
                      })
                    }
                  >
                    <Ionicons name="card-outline" size={16} color={Colors.background} />
                    <Text style={styles.paymentButtonText}>
                      {booking.paymentStatus === "PAID"
                        ? "View payment"
                        : Number(booking.paidAmount || 0) > 0
                          ? "Pay remaining balance"
                          : "Complete demo checkout"}
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color={Colors.background} />
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}><Ionicons name="calendar-outline" size={23} color={Colors.primary} /></View>
            <Text style={styles.emptyTitle}>Your next trip starts here</Text>
            <Text style={styles.emptyText}>Choose an available vehicle. Your reservation will appear here and in the admin booking list.</Text>
            <TouchableOpacity style={styles.browseButton} onPress={() => router.push("/(client)/vehicles")}>
              <Text style={styles.browseText}>Browse available vehicles</Text>
              <Ionicons name="arrow-forward" size={15} color={Colors.background} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.tip}>
          <Ionicons name="information-circle-outline" size={19} color={Colors.primary} />
          <Text style={styles.tipText}>Have your driver&apos;s license ready when you pick up your vehicle.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 19, paddingTop: 24, paddingBottom: 32 },
  eyebrow: { color: Colors.primary, fontSize: 8, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: Colors.white, fontSize: 26, fontWeight: "900", marginTop: 7 },
  subtitle: { color: Colors.muted, fontSize: 10, lineHeight: 16, marginTop: 6 },
  statusRow: { flexDirection: "row", gap: 10, marginTop: 21 },
  statusCard: { flex: 1, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14 },
  statusValue: { color: Colors.primary, fontSize: 23, fontWeight: "900" },
  statusLabel: { color: Colors.muted, fontSize: 8, letterSpacing: 0.8, marginTop: 5 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 27, marginBottom: 11 },
  sectionTitle: { color: "#D7E4DB", fontSize: 8, fontWeight: "800", letterSpacing: 0.9 },
  bookingCount: { color: Colors.muted, fontSize: 8 },
  bookingCard: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 15, overflow: "hidden", marginBottom: 13 },
  vehicleArt: { height: 159, backgroundColor: "#14291B", alignItems: "center", justifyContent: "center" },
  dateBadge: { position: "absolute", left: 13, top: 13, width: 40, height: 48, backgroundColor: Colors.background, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  dateMonth: { color: Colors.primary, fontWeight: "800", fontSize: 8 },
  dateDay: { color: Colors.white, fontWeight: "900", fontSize: 18 },
  plate: { position: "absolute", right: 13, bottom: 11, color: "#718078", fontSize: 8, letterSpacing: 1 },
  bookingDetails: { padding: 15 },
  bookingTopline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bookingCode: { color: Colors.muted, fontSize: 9, fontWeight: "700", letterSpacing: 0.6 },
  statusBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusActive: { borderColor: "#C98A2E", backgroundColor: "#2A2008" },
  statusComplete: { borderColor: Colors.primary, backgroundColor: "#132A16" },
  statusRejected: { borderColor: Colors.danger, backgroundColor: "#2B1715" },
  statusPending: { borderColor: Colors.warning, backgroundColor: "#2A2008" },
  statusText: { fontSize: 8, fontWeight: "800" },
  statusActiveText: { color: Colors.warning },
  statusCompleteText: { color: Colors.primary },
  statusRejectedText: { color: Colors.danger },
  statusPendingText: { color: Colors.warning },
  carName: { color: Colors.white, fontSize: 19, fontWeight: "900", marginTop: 10, marginBottom: 11 },
  rejectionReason: { color: Colors.danger, fontSize: 9, lineHeight: 14, marginBottom: 5 },
  detailLine: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  detailText: { color: "#CCD8CF", fontSize: 9, flex: 1 },
  divider: { height: 1, backgroundColor: Colors.border, marginTop: 14, marginBottom: 11 },
  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  totalLabel: { color: Colors.muted, fontSize: 8, flex: 1 },
  totalPrice: { color: Colors.primary, fontSize: 15, fontWeight: "900" },
  scanButton: { height: 46, backgroundColor: Colors.primary, marginHorizontal: 14, marginBottom: 14, borderRadius: 9, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  scanText: { color: Colors.background, fontSize: 10, fontWeight: "800" },
  paymentButton: { height: 42, backgroundColor: "#B8FF2C", marginHorizontal: 14, marginBottom: 14, borderRadius: 9, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  paymentButtonText: { color: Colors.background, fontSize: 9, fontWeight: "900" },
  cancelButton: { minHeight: 42, marginHorizontal: 14, marginBottom: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.danger, borderRadius: 9, backgroundColor: "#2B1715" },
  cancelText: { color: Colors.danger, fontSize: 9, fontWeight: "800" },
  emptyCard: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: "center", padding: 20, borderRadius: 14 },
  emptyIcon: { width: 45, height: 45, borderRadius: 13, backgroundColor: "#192D20", alignItems: "center", justifyContent: "center" },
  emptyTitle: { color: Colors.white, fontSize: 13, fontWeight: "800", marginTop: 13 },
  emptyText: { color: Colors.muted, fontSize: 9, lineHeight: 15, textAlign: "center", marginTop: 7 },
  browseButton: { flexDirection: "row", alignItems: "center", gap: 8, height: 40, backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 13, marginTop: 15 },
  browseText: { color: Colors.background, fontSize: 10, fontWeight: "800" },
  message: { color: Colors.muted, fontSize: 10, textAlign: "center", paddingVertical: 28 },
  error: { color: Colors.warning, fontSize: 10, textAlign: "center", paddingVertical: 28 },
  tip: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#14251B", borderRadius: 10, padding: 12, marginTop: 14 },
  tipText: { color: "#B8C8C0", fontSize: 9, lineHeight: 14, flex: 1 },
});
