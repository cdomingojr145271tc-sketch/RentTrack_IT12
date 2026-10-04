import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useSQLiteContext } from "expo-sqlite";

import { Colors } from "../../constants/colors";
import { createVehicle } from "../../services/database";
import { persistVehiclePhoto } from "../../services/vehiclePhotos";

export default function AddVehicle() {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const db = useSQLiteContext();

  const returnToFleet = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/garage");
    }
  };

  const handleSave = async () => {
    const dailyRate = Number(pricePerDay);
    if (
      !brand.trim() ||
      !model.trim() ||
      !vehicleType.trim() ||
      !plateNumber.trim() ||
      !Number.isFinite(dailyRate) ||
      dailyRate <= 0
    ) {
      Alert.alert("Missing or invalid info", "Complete all fields with a valid daily rate.");
      return;
    }

    try {
      const savedImageUri = await persistVehiclePhoto(imageUri);
      await createVehicle(db, {
        brand,
        model,
        vehicleType,
        plateNumber,
        dailyRate,
        imageUri: savedImageUri,
      });
      returnToFleet();
    } catch (error) {
      const message = error?.message?.includes("UNIQUE")
        ? "A vehicle with this plate number already exists."
        : "The vehicle could not be saved. Please try again.";
      Alert.alert("Save failed", message);
    }
  };

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Photo access required",
          "Allow RentTrack to access your photos to attach a vehicle image."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Image unavailable", "Please try selecting the image again.");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <TouchableOpacity onPress={returnToFleet}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.label}>NEW VEHICLE</Text>

      <Text style={styles.title}>Add a vehicle</Text>

      <Text style={styles.inputLabel}>BRAND</Text>
      <TextInput
        placeholder="e.g. Toyota"
        placeholderTextColor={Colors.muted}
        style={styles.input}
        value={brand}
        onChangeText={setBrand}
      />

      <Text style={styles.inputLabel}>MODEL</Text>
      <TextInput
        placeholder="e.g. Fortuner"
        placeholderTextColor={Colors.muted}
        style={styles.input}
        value={model}
        onChangeText={setModel}
      />

      <Text style={styles.inputLabel}>VEHICLE IMAGE</Text>
      {imageUri ? (
        <View style={styles.imagePreview}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() => setImageUri(null)}
          >
            <Text style={styles.removeImageText}>Remove image</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          <Text style={styles.imagePickerText}>Choose from photos</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.inputLabel}>VEHICLE TYPE</Text>
      <TextInput
        placeholder="e.g. SUV/SPORTS BIKE"
        placeholderTextColor={Colors.muted}
        style={styles.input}
        value={vehicleType}
        onChangeText={setVehicleType}
      />


      <Text style={styles.inputLabel}>PLATE NUMBER</Text>
      <TextInput
        placeholder="e.g. NCR 1912"
        placeholderTextColor={Colors.muted}
        style={styles.input}
        value={plateNumber}
        onChangeText={setPlateNumber}
      />

      <Text style={styles.inputLabel}>PRICE PER DAY</Text>
      <TextInput
        placeholder="e.g. 4200"
        placeholderTextColor={Colors.muted}
        style={styles.input}
        value={pricePerDay}
        onChangeText={setPricePerDay}
        keyboardType="numeric"
      />


      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save vehicle</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    padding: 18,
    paddingBottom: 40,
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
    fontSize: 28,
    marginTop: 5,
    marginBottom: 30,
  },

  inputLabel: {
    color: "#B8C9C1",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 7,
    marginTop: 15,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 9,
    paddingHorizontal: 14,
    color: Colors.white,
    backgroundColor: Colors.surface,
  },

  imagePicker: {
    height: 150,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.border,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
  },

  imagePickerText: {
    color: Colors.primary,
    fontWeight: "700",
  },

  imagePreview: {
    height: 190,
    borderRadius: 9,
    overflow: "hidden",
    backgroundColor: Colors.surface,
  },

  previewImage: {
    width: "100%",
    height: "100%",
  },

  removeImageButton: {
    position: "absolute",
    right: 10,
    bottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: Colors.background,
  },

  removeImageText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "700",
  },

  button: {
    height: 50,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },

  buttonText: {
    color: Colors.background,
    fontWeight: "800",
    textAlign: "center",
  },
});