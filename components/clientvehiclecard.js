import { Ionicons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { Colors } from "../constants/colors";
import { VEHICLE_IMAGES } from "../constants/vehicleImages";

export default function ClientVehicleCard({ vehicle, onBook, compact = false }) {
  const status = (vehicle.status || "AVAILABLE").toUpperCase();
  const isAvailable = status === "AVAILABLE";
  const statusColor =
    status === "MAINTENANCE" ? Colors.danger : isAvailable ? Colors.primary : Colors.warning;
  const imageSource = vehicle.imageUri
    ? { uri: vehicle.imageUri }
    : VEHICLE_IMAGES[vehicle.imageAssetKey] || VEHICLE_IMAGES.vios;

  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      <View style={[styles.art, compact && styles.compactArt]}>
        <Image
          source={imageSource}
          style={styles.vehicleImage}
          resizeMode="cover"
        />
        <View style={styles.imageShade} />
        <View style={styles.availability}>
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Text style={[styles.availabilityText, { color: statusColor }]}>
            {status}
          </Text>
        </View>
        <Text style={styles.plate}>{vehicle.plateNumber || "PLATE PENDING"}</Text>
      </View>
      <View style={styles.details}>
        <View style={styles.titleRow}>
          <View style={styles.name}>
            <Text style={styles.make}>{vehicle.make}</Text>
            <Text style={styles.model}>{vehicle.model}</Text>
          </View>
          <Text style={styles.price}>
            ₱{vehicle.price.toLocaleString()}
            <Text style={styles.perDay}> / day</Text>
          </Text>
        </View>
        <Text style={styles.features}>{vehicle.features}</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!isAvailable}
          style={[styles.bookButton, !isAvailable && styles.bookButtonDisabled]}
          onPress={onBook}
        >
          <Text style={[styles.bookText, !isAvailable && styles.bookTextDisabled]}>
            {isAvailable ? "Reserve this ride" : "Currently unavailable"}
          </Text>
          {isAvailable && (
            <Ionicons name="arrow-forward" size={16} color={Colors.background} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 15,
  },
  compactCard: {
    width: 270,
    marginRight: 12,
    marginBottom: 0,
  },
  art: {
    height: 154,
    backgroundColor: "#12271D",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  vehicleImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#06130E45",
  },
  compactArt: {
    height: 135,
  },
  availability: {
    position: "absolute",
    left: 13,
    top: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0A1A12",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  availabilityText: {
    color: Colors.primary,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  plate: {
    position: "absolute",
    bottom: 10,
    right: 12,
    color: "#718078",
    fontSize: 9,
    letterSpacing: 1,
  },
  details: {
    padding: 15,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  name: {
    flex: 1,
    marginRight: 5,
  },
  make: {
    color: Colors.muted,
    fontSize: 10,
    fontWeight: "600",
  },
  model: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: "800",
    marginTop: 3,
  },
  price: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  perDay: {
    color: Colors.muted,
    fontSize: 9,
    fontWeight: "500",
  },
  features: {
    color: Colors.muted,
    fontSize: 10,
    marginTop: 8,
  },
  bookButton: {
    height: 42,
    backgroundColor: Colors.primary,
    borderRadius: 9,
    marginTop: 14,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bookButtonDisabled: {
    backgroundColor: "#1A3025",
  },
  bookText: {
    color: Colors.background,
    fontSize: 11,
    fontWeight: "800",
  },
  bookTextDisabled: {
    color: Colors.muted,
  },
});
