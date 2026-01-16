import axios from 'axios';

interface Coordinates {
  latitude: number;
  longitude: number;
}

export class GoogleMapsService {
  private static readonly DISTANCE_MATRIX_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';

  /**
   * Get the Google Maps API key from environment variables
   */
  private static getApiKey(): string | undefined {
    return process.env.GOOGLE_MAPS_API_KEY;
  }

  /**
   * Calculate distance between two coordinates using Google Distance Matrix API
   * @param origin Origin coordinates (latitude, longitude)
   * @param destination Destination coordinates (latitude, longitude)
   * @returns Distance in meters
   */
  static async calculateDistance(
    origin: Coordinates,
    destination: Coordinates
  ): Promise<number> {
    try {
      const apiKey = this.getApiKey();
      if (!apiKey) {
        throw new Error('Google Maps API key is not configured');
      }

      const response = await axios.get(this.DISTANCE_MATRIX_URL, {
        params: {
          origins: `${origin.latitude},${origin.longitude}`,
          destinations: `${destination.latitude},${destination.longitude}`,
          mode: 'driving',
          key: apiKey
        }
      });

      if (
        response.data.status === 'OK' &&
        response.data.rows?.length > 0 &&
        response.data.rows[0].elements?.length > 0 &&
        response.data.rows[0].elements[0].status === 'OK'
      ) {
        return response.data.rows[0].elements[0].distance.value;
      } else {
        console.error('Google Distance Matrix API error:', response.data);
        // Fallback to haversine in case of API error
        return this.calculateHaversineDistance(origin, destination);
      }
    } catch (error) {
      console.error('Error calculating distance with Google Maps API:', error);
      // Fallback to haversine in case of API error
      return this.calculateHaversineDistance(origin, destination);
    }
  }

  /**
   * Fallback method to calculate distance using Haversine formula
   * Used when Google Maps API fails or is not available
   */
  private static calculateHaversineDistance(
    origin: Coordinates,
    destination: Coordinates
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (origin.latitude * Math.PI) / 180;
    const φ2 = (destination.latitude * Math.PI) / 180;
    const Δφ = ((destination.latitude - origin.latitude) * Math.PI) / 180;
    const Δλ = ((destination.longitude - origin.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
}