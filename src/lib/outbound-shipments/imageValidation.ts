export function isDisallowedSvgImage(file: {
  name: string;
  type: string;
}): boolean {
  const type = file.type.trim().toLowerCase();
  const name = file.name.trim().toLowerCase();

  if (type === "image/svg+xml" || type.includes("svg")) {
    return true;
  }

  return name.endsWith(".svg") || name.endsWith(".svgz");
}

export function isAllowedOutboundShipmentImage(file: {
  name: string;
  type: string;
}): boolean {
  const type = file.type.trim().toLowerCase();
  if (!type.startsWith("image/")) {
    return false;
  }
  if (isDisallowedSvgImage(file)) {
    return false;
  }
  return true;
}
