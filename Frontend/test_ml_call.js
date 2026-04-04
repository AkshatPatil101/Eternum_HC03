(async () => {
  const patientData = {
    hr: 80,
    bp_sys: 120,
    bp_dia: 80,
    spo2: 98,
    gcs: 15,
    temp: 37.0,
    rr: 16,
    age: 45,
    gender: 0
  };
  
  try {
    const response = await fetch("http://localhost:8000/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patientData)
    });
    const result = await response.json();
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Fetch failed", err);
  }
})();
