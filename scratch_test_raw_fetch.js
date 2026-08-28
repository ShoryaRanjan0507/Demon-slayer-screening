async function testRawFetch() {
  const url = "https://ep-super-recipe-aesw3lnz.c-2.us-east-2.aws.neon.tech/sql";
  const token = "npg_e6wn1AzBgGpF";
  const connStr = "postgresql://neondb_owner:npg_e6wn1AzBgGpF@ep-super-recipe-aesw3lnz.c-2.us-east-2.aws.neon.tech/neondb";

  console.log("Testing raw native fetch with password in bearer token...");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Neon-Connection-String": connStr
      },
      body: JSON.stringify({
        query: "SELECT email, name, roll_no as \"rollNo\" FROM viewers ORDER BY registered_at DESC;"
      })
    });

    console.log("HTTP Response status:", res.status);
    const data = await res.json();
    console.log("Raw Response JSON:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Raw Fetch Error:", err);
  }
}

testRawFetch();
