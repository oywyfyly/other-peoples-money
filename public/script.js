
const supabaseUrl = 'https://tgadkoabxdpekrhvprap.supabase.co'
const supabaseKey = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnYWRrb2FieGRwZWtyaHZwcmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3NjYzMzMsImV4cCI6MjA1NTM0MjMzM30.vsxmrEqaCJ0C6yKv1qigA6u6qDCoq9-AdyL33g756W8`
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
const proxy = 'https://corsproxy.io/';

let auR, auP, auE, globalDataV, globalDataJ, sKey;

function shortenNumbers(data) {
    return data.map(item => ({
        ...item,
        profit: item.profit >= 1_000_000_000 ? (item.profit / 1_000_000_000).toFixed(1) + 'B' :
               item.profit >= 1_000_000 ? (item.profit / 1_000_000).toFixed(1) + 'M' :
               item.profit,
        revenue: item.revenue >= 1_000_000_000 ? (item.revenue / 1_000_000_000).toFixed(1) + 'B' :
                 item.revenue >= 1_000_000 ? (item.revenue / 1_000_000).toFixed(1) + 'M' :
                 item.revenue
    }));
}

async function queryDatabase(){
    let { data: australiaDataR } = await supabase
    .from('australiaTable')
    .select('*')
    .order('revenue', { ascending: false });

    let { data: australiaDataP } = await supabase
    .from('australiaTable')
    .select('*')
    .order('profit', { ascending: false });

    let { data: australiaDataE } = await supabase
    .from('australiaTable')
    .select('*')
    .order('employees', { ascending: false });

    let auR = shortenNumbers(australiaDataR)
    let auP = shortenNumbers(australiaDataP)
    let auE = shortenNumbers(australiaDataE)
    
    let { data: globalDataV } = await supabase
    .from('globalTable')
    .select('*')
    .order('valuation', { ascending: false });

    let { data: globalDataJ } = await supabase
    .from('globalTable')
    .select('*')
    .order('timestamp', { ascending: false });
    
    if (australiaDataR.length == 0 && globalDataV.length == 0) {

        console.log('empty')

        // fetchAustralia()
        // fetchGlobal()
    }

    loadTable(auR, 'r');

    document.getElementById('sort').addEventListener("click", (event) => {
        if (event.target.tagName === "BUTTON") {
            document.querySelectorAll("#sort button").forEach(btn => {
                btn.style.textDecoration = "none";
                btn.style.fontWeight = "400";
            });
    
            sKey = event.target.textContent.toLowerCase()[0];

            if (sKey === 'r') {loadTable(auR, sKey)}
            if (sKey === 'p') {loadTable(auP, sKey)}
            if (sKey === 'e') {loadTable(auE, sKey)}
            if (sKey === 'v') {loadTable(globalDataV, sKey)}
            if (sKey === 'j') {loadTable(globalDataJ, sKey)}

            event.target.style.textDecoration = "underline";
            event.target.style.fontWeight = "600";
        }
    });

    document.getElementById('default').addEventListener("click", (event) => {
        event.target.style.color = 'white';
        document.getElementById('global').style.color = 'grey';
    
        loadTable(auR, 'r');
    
        document.querySelector('#sortRevenue').innerHTML = 'Revenue'
        document.querySelector('#sortProfit').textContent = 'Profit'
        document.querySelector('#sortEmployee').style.display = 'block'
        document.querySelector('.sort').style.width = '300px'
    })
    
    document.getElementById('global').addEventListener("click", (event) => {
        event.target.style.color = 'white';
        document.getElementById('default').style.color = 'grey';
        document.querySelector('.content').innerHTML = '<p>Loading...</p>';
    
        loadTable(globalDataV, 'v')
    
        document.querySelector('#sortRevenue').innerHTML = 'Valuation';
        document.querySelector('#sortProfit').textContent = 'Joined';
    
        document.querySelector('#sortRevenue').style.fontWeight = '600';
        document.querySelector('#sortRevenue').style.textDecoration = 'underline';
    
        document.querySelector('#sortProfit').style.fontWeight = '400';
        document.querySelector('#sortProfit').style.textDecoration = 'none';
    
        document.querySelector('#sortEmployee').style.display = 'none'
        document.querySelector('.sort').style.width = '200px'
    })
}
queryDatabase()

async function fetchAustralia(){
    const urlRevenue = encodeURIComponent('https://www.tradingview.com/markets/stocks-australia/market-movers-highest-revenue/');
    const urlProfit = encodeURIComponent('https://www.tradingview.com/markets/stocks-australia/market-movers-highest-net-income/');
    const urlEmployee = encodeURIComponent('https://www.tradingview.com/markets/stocks-australia/market-movers-largest-employers/');
    
    // Fetch page HTML as text
    const [profitRes, revenueRes, employeeRes] = await Promise.all([
        fetch(proxy + urlProfit).then(res => res.text()),
        fetch(proxy + urlRevenue).then(res => res.text()),
        fetch(proxy + urlEmployee).then(res => res.text()),
    ]);

    // Convert to document object
    const parser = new DOMParser();
    const docProfit = parser.parseFromString(profitRes, 'text/html');
    const docRevenue = parser.parseFromString(revenueRes, 'text/html');
    const docEmployee = parser.parseFromString(employeeRes, 'text/html');

    // Filter to get table
    filterTableProfit = docProfit.querySelectorAll('.row-RdUXZpkv');
    filterTableRevenue = docRevenue.querySelectorAll('.row-RdUXZpkv');
    filterTableEmployee = docEmployee.querySelectorAll('.row-RdUXZpkv');

    // Convert tables to arrays
    let arrayProfit = Array.from(filterTableProfit).slice(1);
    let arrayRevenue = Array.from(filterTableRevenue).slice(1);
    let arrayEmployee = Array.from(filterTableEmployee).slice(1);
    
    // Filter function to get data
    const extractDataAu = (rows, key) => 
        rows.map(row => ({
            Company: row.querySelector('td a').title.split('−')[1]
                .replace(/\.|LIMITED|GROUP|HOLDINGS|LTD|CORPORATION/g, '').trim(),
            [key]: row.querySelectorAll('td')[1].innerText.split('A')[0].split('K')[0],
            Sector: row.querySelectorAll('td')[11].querySelector('a').title
        }));
    
    // Execute and store function
    const profitData = extractDataAu(arrayProfit, "profit");
    const revenueData = extractDataAu(arrayRevenue, "revenue");
    const employeeData = extractDataAu(arrayEmployee, "employees");

    const masterObject = [...profitData, ...revenueData, ...employeeData].reduce((acc, { Company, Sector, profit, revenue, employees }) => {
        acc[Company] = acc[Company] || { 
            Company, 
            Sector: Sector || 'n/a', 
            profit: 0, 
            revenue: 0, 
            employees: 0 
        };
    
        // Helper function to convert values with 'M' or 'B'
        const convertValue = (value) => {
            if (typeof value === 'string' && (value.includes('M') || value.includes('B'))) {
                let num = parseFloat(value.replace(/[^\d.-]/g, ''));
                if (value.includes('B')) num *= 1_000_000_000;
                if (value.includes('M')) num *= 1_000_000;
                return Math.round(num);  // Return rounded value
            }
            return value;
        };
    
        // Ensure both profit and revenue are converted if they exist
        if (profit !== undefined) acc[Company].profit = convertValue(profit);
        if (revenue !== undefined) acc[Company].revenue = convertValue(revenue);
    
        // Ensure employees defaults to 0 if missing
        acc[Company].employees = Math.round(employees) || 0;
    
        return acc;
    }, {});
    const australiaData = Object.values(masterObject);

    const { error } = await supabase.from('australiaTable').delete().neq('id', 0);
    if (error) console.error(error);
    else console.log("All AU rows deleted successfully!");
    
    let saveDataAustralia = await supabase.from('australiaTable').upsert(australiaData.map(row => ({
        company: row.Company,
        sector: row.Sector,
        profit: row.profit,
        revenue: row.revenue,
        employees: row.employees,
    })))

    console.log(saveDataAustralia)
}

async function fetchGlobal() {

    // Fetch page HTML as text
    const urlGlobal = encodeURIComponent('https://www.cbinsights.com/research-unicorn-companies');
    const globalRes = await fetch(proxy + urlGlobal).then(res => res.text());

    // Convert to document object
    const parser = new DOMParser();
    const docGlobal = parser.parseFromString(globalRes, 'text/html');

    // Filter to get table
    filterTableGlobal = docGlobal.querySelectorAll('tbody tr');

    // Convert tables to arrays
    let arrayGlobal = Array.from(filterTableGlobal);
    
    // Filter function to get data
    const extractDataGlobal = (rows) => 
        rows.map(row => ({
            Company: row.querySelector('td a').textContent,
            Valuation: row.querySelectorAll('td')[1].innerText.split('$')[1],
            Joined: row.querySelectorAll('td')[2].innerText,
            Country: row.querySelectorAll('td')[3].innerText,
            City: row.querySelectorAll('td')[4].innerText,
            Industry: row.querySelectorAll('td')[5].innerText,
        }));
    
    // Execute and store function
    let globalExtract = extractDataGlobal(arrayGlobal, "Global");
    
    // Merge data into object and convert to array
    // const getAi = await fetch("http://localhost:3100/api/index", {    
    const getAi = await fetch("/api/index.js", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ data: globalExtract })
    })
    globalData = await getAi.json()

    globalData.forEach(company => {
        company.Timestamp = new Date(company.Joined).getTime()
    })
    globalData.sort((a, b) => a.Timestamp - b.Timestamp)

    console.log(globalData)

    const { error } = await supabase.from('globalTable').delete().neq('id', 0);
    if (error) console.error(error);
    else console.log("All rows deleted successfully!");

    let saveDataGlobal = await supabase.from('globalTable').upsert(globalData.map(row => ({
        company: row.Company,
        valuation: row.Valuation,
        joined: row.Joined || "n/a",
        country: row.Country || "n/a",
        city: row.City || "n/a",
        industry: row.Industry || "n/a",
        description: row.Description || "n/a",
        timestamp: row.Timestamp
    })))
    
    console.log(saveDataGlobal)
}

function loadTable(data, sKey) {

    if (sKey === 'r' || sKey === 'p' || sKey === 'e') {
        const getContent = document.querySelector('.content');
        const tableData = data.map((row, index) => `
            <div class="row">
                <div class="rowInfo">
                    <div class="rowRank">
                        <p>${index + 1}</p>
                    </div>

                    <div class="rowLeft">
                        <p>${row.company}</p>
                        <div class="info">
                            ${sKey !== "r" ? `<p>Revenue: ${row.revenue || "n/a"}</p>` : ""}
                            ${sKey !== "p" ? `<p>Profit: ${row.profit || "n/a"}</p>` : ""}
                            ${sKey !== "e" ? `<p>Employees: ${row.employees || "n/a"}K</p>` : ""}
                            <p>Sector: ${row.sector}</p>
                        </div>
                    </div>
                    
                    <div class="rowRight">
                        ${sKey == "r" ? `<p>${row.revenue || "n/a"}</p>` : ""}
                        ${sKey == "p" ? `<p>${row.profit || "n/a"}</p>` : ""}
                        ${sKey == "e" ? `<p>${row.employees || "n/a"} K</p>` : ""}
                    </div>
                </div>
            </div>
        `).join('')

        getContent.innerHTML = tableData;
    }
    else {
        const getContent = document.querySelector('.content');
        const tableDataGlobal = data.map((row, index) => `
            <div class="row">
                <div class="rowInfo">
                    <div class="rowRank">
                        <p>${index + 1}</p>
                    </div>

                    <div class="rowLeft">
                        <p>${row.company}</p>
                        <div class="info">
                            ${sKey !== "v" ? `<p>Valuation: ${row.valuation || "n/a"} B</p>` : ""}
                            ${sKey !== "j" ? `<p>Joined: ${row.joined || "n/a"}</p>` : ""}
                            ${sKey !== "country" ? `<p>Country: ${row.country || "n/a"}</p>` : ""}
                            ${sKey !== "city" ? `<p>City: ${row.city || "n/a"}</p>` : ""}
                            ${sKey !== "industry" ? `<p>Industry: ${row.industry || "n/a"}</p>` : ""}
                        </div>
                    </div>
                    
                    <div class="rowRight">
                        ${sKey == "v" ? `<p>$${row.valuation || "0"} B</p>` : ""}
                        ${sKey == "j" ? `<p>${row.joined || "0"}</p>` : ""}
                    </div>
                </div>
                
                <div class=hoverInfo>
                    <p>${row.description || "Loading description..."}</p>
                </div>
            </div>
        `).join('');

        getContent.innerHTML = tableDataGlobal;
    }
}