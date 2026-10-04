import { Directory, File, Paths } from "expo-file-system";

export async function persistVehiclePhoto(uri) {
  if (!uri) return null;

  const directory = new Directory(Paths.document, "vehicle-images");
  directory.create({ idempotent: true, intermediates: true });

  const source = new File(uri);
  const extension = source.extension || ".jpg";
  const destination = new File(
    directory,
    `vehicle-${Date.now()}${extension}`
  );

  await source.copy(destination);
  return destination.uri;
}