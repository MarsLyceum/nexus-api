import axios from 'axios';

export async function getCurrentIPAddress(): Promise<string> {
    try {
        // Make a request to httpbin.org to get the IP address
        const response = await axios.get('https://httpbin.org/ip');
        // Extract the IP address from the response data
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const ipAddress = response.data.origin as string;
        return ipAddress;
    } catch (error) {
        // Log any errors to the console
        console.error('Error fetching IP address:', error);
        throw new Error('Failed to fetch IP address');
    }
}
