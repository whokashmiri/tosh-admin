
export type OrderImageType =
  | "pickup"
  | "delivery"
  | "cancellation";

export async function compressOrderImage(
  uri: string,
  _type: OrderImageType,
): Promise<string> {
  return uri;
}

export async function compressOrderImages(
  uris: string[],
  _type: OrderImageType,
): Promise<string[]> {
  return uris;
}
