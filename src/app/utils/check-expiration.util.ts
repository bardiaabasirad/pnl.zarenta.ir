export function CheckExpirationUtil(time: string, expirationTime: number): boolean {
  // Parse the time string to Date object
  const startTime = new Date(time);

  // Get current time
  const currentTime = new Date();

  // Calculate expiration time by adding expirationTime (in seconds) to startTime
  const expirationDateTime = new Date(startTime.getTime() + (expirationTime * 1000));

  // Check if current time is greater than expiration time
  return expirationDateTime > currentTime;
}
