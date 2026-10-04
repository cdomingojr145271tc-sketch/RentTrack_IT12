import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { useLocalSearchParams, router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import { Colors } from "../../constants/colors";
import { getVehicleById } from "../../services/database";

export default function VehicleDetails() {
  const { id } = useLocalSearchParams();
  const db = useSQLiteContext();
  const [vehicle, setVehicle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const returnToFleet = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/garage");
    }
  };

  useEffect(() => {
    let isMounted = true;

    getVehicleById(db, id)
      .then((row) => {
        if (isMounted) setVehicle(row);
      })
      .catch(() => {
        if (isMounted) setVehicle(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [db, id]);

  if (!vehicle) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={returnToFleet}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.text}>
          {isLoading ? "Loading vehicle..." : "Vehicle not found"}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={returnToFleet}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.label}>VEHICLE</Text>

      <Text style={styles.title}>
        {vehicle.name}
      </Text>

      <View style={styles.card}>
        <Text style={styles.brand}>
          {vehicle.brand}
        </Text>

        <Text style={styles.plate}>
          {vehicle.plateNumber || "No plate number"}
        </Text>

        <Text style={styles.price}>
          PHP {Number(vehicle.price).toLocaleString()}
          {" / day"}
        </Text>

        <Text style={styles.type}>{vehicle.vehicleType}</Text>

        <Text style={styles.status}>
          {vehicle.status}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 18,
  },

  back: {
    color: Colors.primary,
    marginBottom: 40,
  },

  label: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "800",
  },

  title: {
    color: Colors.white,
    fontSize: 30,
    marginTop: 5,
  },

  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 20,
    marginTop: 25,
  },

  brand: {
    color: Colors.muted,
    fontSize: 11,
  },

  plate: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },

  price: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 20,
  },

  status: {
    color: Colors.primary,
    marginTop: 20,
  },

  type: {
    color: Colors.muted,
    marginTop: 8,
  },

  text: {
    color: Colors.white,
  },
});