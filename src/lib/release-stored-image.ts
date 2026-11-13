export async function releaseStoredImage(src: string) {
  try {
    const response = await fetch("/api/uploads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ src }),
    });
    return response.ok || response.status === 404;
  } catch {
    return false;
  }
}

export async function releaseStoredImages(srcs: string[]) {
  const results = await Promise.all(srcs.map((src) => releaseStoredImage(src)));
  return results.every(Boolean);
}
