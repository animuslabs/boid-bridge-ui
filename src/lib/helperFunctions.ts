// Function to check if an API URL is working by hitting /v1/chain/get_info
async function isUrlWorking(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/v1/chain/get_info`, { method: "GET" });
    if (response.ok) {
      const data = await response.json();
      if (data && data.chain_id) {
        console.log(`API at ${url} is working with chain ID: ${data.chain_id}`);
        return true;
      }
    }
    console.error(`API at ${url} responded but is invalid.`);
    return false;
  } catch (error) {
    console.error(`URL check failed for ${url}:`, error);
    return false;
  }
}

// Function to get a working API URL from a list
export async function getWorkingUrl(urls: string[]): Promise<string> {
  for (const url of urls) {
    const isWorking = await isUrlWorking(url);
    if (isWorking) {
      console.log(`Using working URL: ${url}`);
      return url;
    }
  }
  throw new Error("No working URLs found.");
}
