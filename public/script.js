
const proxy = 'https://corsproxy.io/';
const urlRevenue = encodeURIComponent('https://www.tradingview.com/markets/stocks-australia/market-movers-highest-revenue/');
const urlProfit = encodeURIComponent('https://www.tradingview.com/markets/stocks-australia/market-movers-highest-net-income/');
const urlEmployee = encodeURIComponent('https://www.tradingview.com/markets/stocks-australia/market-movers-largest-employers/');
const urlGlobal = encodeURIComponent('https://www.cbinsights.com/research-unicorn-companies');

let masterArray = [];
let globalData1 = [];

async function fetchData() {

    // Fetch page HTML as text
    const [profitRes, revenueRes, employeeRes, globalRes] = await Promise.all([
        fetch(proxy + urlProfit).then(res => res.text()),
        fetch(proxy + urlRevenue).then(res => res.text()),
        fetch(proxy + urlEmployee).then(res => res.text()),
        fetch(proxy + urlGlobal).then(res => res.text())
    ]);
    
    const parser = new DOMParser();

    // Convert to document object
    const docProfit = parser.parseFromString(profitRes, 'text/html');
    const docRevenue = parser.parseFromString(revenueRes, 'text/html');
    const docEmployee = parser.parseFromString(employeeRes, 'text/html');
    const docGlobal = parser.parseFromString(globalRes, 'text/html');

    // Filter to get table
    filterTableProfit = docProfit.querySelectorAll('.row-RdUXZpkv');
    filterTableRevenue = docRevenue.querySelectorAll('.row-RdUXZpkv');
    filterTableEmployee = docEmployee.querySelectorAll('.row-RdUXZpkv');
    filterTableGlobal = docGlobal.querySelectorAll('tbody tr');

    // Convert tables to arrays
    let arrayProfit = Array.from(filterTableProfit).slice(1);
    let arrayRevenue = Array.from(filterTableRevenue).slice(1);
    let arrayEmployee = Array.from(filterTableEmployee).slice(1);
    let arrayGlobal = Array.from(filterTableGlobal);
    
    // Filter function to get data
    const extractDataAu = (rows, key) => 
        rows.map(row => ({
            Company: row.querySelector('td a').title.split('−')[1]
                .replace(/\.|LIMITED|GROUP|HOLDINGS|LTD|CORPORATION/g, '').trim(),
            [key]: row.querySelectorAll('td')[1].innerText.split('A')[0],
            Sector: row.querySelectorAll('td')[11].querySelector('a').title
        }));

    const extractDataGlobal = (rows) => 
        rows.map(row => ({
            Company: row.querySelector('td a').textContent,
            Valuation: row.querySelectorAll('td')[1].innerText,
            Joined: row.querySelectorAll('td')[2].innerText,
            Country: row.querySelectorAll('td')[3].innerText,
            City: row.querySelectorAll('td')[4].innerText,
            Industry: row.querySelectorAll('td')[5].innerText,
        }));
    
    // Execute and store function
    const profitData = extractDataAu(arrayProfit, "Profit");
    const revenueData = extractDataAu(arrayRevenue, "Revenue");
    const employeeData = extractDataAu(arrayEmployee, "Employees");
    const globalData = extractDataGlobal(arrayGlobal, "Global");
    globalCompanies = globalData.map(item => item.Company);
    
    // Merge data into object
    const masterObject = [...profitData, ...revenueData, ...employeeData].reduce((acc, { Company, Sector, ...rest }) => {
        acc[Company] = { ...(acc[Company] || { Company, Sector }), ...rest };
        return acc;
    }, {});
    
    // Convert to array and call function to load in HTML
    masterArray = Object.values(masterObject);
    loadTable(masterArray.slice(0, 100), "Revenue");

    globalData1 = await fetchAi(globalCompanies, globalData);
}

async function fetchAi(globalCompanies, globalData) {
    
    const response = await fetch("http://localhost:3000/generate", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ globalCompanies })
    })

    const aiResponse = await response.json()
    const aiResponseString = aiResponse.choices[0].message.content;
    const aiResponseArray = aiResponseString
        .split('\n')
        .filter(Boolean)
        .map(line => line.split(':')[1]);
    globalData = globalData.map((company, index) => ({...company, Description: aiResponseArray[index] }));

    return globalData;
}

// Load data into HTML
function loadTable(data, sortKey) {
    const getContent = document.querySelector('.content');
    const tableData = data.map((row, index) => `
        <div class="row">
            <div class="rowInfo">
                <div class="rowRank">
                    <p>${index + 1}</p>
                </div>

                <div class="rowLeft">
                    <p>${row.Company}</p>
                    <div class="info">
                        ${sortKey !== "Revenue" ? `<p>Revenue: ${row.Revenue || "n/a"}</p>` : ""}
                        ${sortKey !== "Profit" ? `<p>Profit: ${row.Profit || "n/a"}</p>` : ""}
                        ${sortKey !== "Employees" ? `<p>Employees: ${row.Employees || "n/a"}</p>` : ""}
                        <p>Sector: ${row.Sector}</p>
                    </div>
                </div>
                
                <div class="rowRight">
                    <p>${row[sortKey] || "0"}</p>
                </div>
            </div>
        </div>
    `).join('');

    getContent.innerHTML = tableData;
}

// Load data into global HTML
function loadTableGlobal(data, sortKey) {
    const getContent = document.querySelector('.content');
    const tableDataGlobal = data.map((row, index) => `
        <div class="row">
            <div class="rowInfo">
                <div class="rowRank">
                    <p>${index + 1}</p>
                </div>

                <div class="rowLeft">
                    <p>${row.Company}</p>
                    <div class="info">
                        ${sortKey !== "Valuation" ? `<p>Valuation: ${row.Valuation || "n/a"}</p>` : ""}
                        ${sortKey !== "Joined" ? `<p>Joined: ${row.Joined || "n/a"}</p>` : ""}
                        ${sortKey !== "Country" ? `<p>Country: ${row.Country || "n/a"}</p>` : ""}
                        ${sortKey !== "City" ? `<p>City: ${row.City || "n/a"}</p>` : ""}
                        ${sortKey !== "Industry" ? `<p>Industry: ${row.Industry || "n/a"}</p>` : ""}
                    </div>
                </div>
                
                <div class="rowRight">
                    ${sortKey !== "Joined" ? `<p>${row[sortKey] || "0"} B</p>` : ""}
                    ${sortKey !== "Valuation" ? `<p>${row[sortKey] || "0"}</p>` : ""}
                </div>
            </div>
            
            <div class=hoverInfo>
                <p>${row.Description || "Loading description..."}</p>
            </div>
        </div>
    `).join('');

    getContent.innerHTML = tableDataGlobal;
}

document.getElementById('sort').addEventListener("click", (event) => {
    if (event.target.tagName === "BUTTON") {
        document.querySelectorAll("#sort button").forEach(btn => {
            btn.style.textDecoration = "none";
            btn.style.fontWeight = "400";
        });

        event.target.style.textDecoration = "underline";
        event.target.style.fontWeight = "600";

        const sortKey = event.target.textContent; // "Revenue", "Profit", or "Employees"

        if (sortKey === 'Revenue' || sortKey === 'Profit' || sortKey === 'Employees') {
            // Sort with in-place conversion of "B" and "M" values
            const sortedData = [...masterArray].sort((a, b) => {
                const convert = (value) => {
                    if (!value) return 0;
                    const num = parseFloat(value.replace(/[^\d.-]/g, ''));
                    if (value.includes('B')) return num * 1_000_000_000;
                    if (value.includes('M')) return num * 1_000_000;
                    return num;
                };
                return convert(b[sortKey]) - convert(a[sortKey]);
            });
    
            loadTable(sortedData.slice(0, 100), sortKey); // Pass sortKey for dynamic rendering
        }
        else if (sortKey === "Joined") {
            const sortedGlobalData = [...globalData1].sort((a, b) => {
                const dateA = new Date(a.Joined); // Convert to date object
                const dateB = new Date(b.Joined);
                return dateB - dateA; // Sort in descending order (latest first)
            });

            loadTableGlobal(sortedGlobalData, sortKey);
        }
        else {
            loadTableGlobal(globalData1, sortKey);
        }
    }
});

fetchData();


document.getElementById('default').addEventListener("click", (event) => {
    event.target.style.color = 'white';
    document.getElementById('global').style.color = 'grey';

    loadTable(masterArray, 'Revenue');

    document.querySelector('#sortRevenue').innerHTML = 'Revenue'
    document.querySelector('#sortProfit').textContent = 'Profit'
    document.querySelector('#sortEmployee').style.display = 'block'
    document.querySelector('.sort').style.width = '300px'
})


document.getElementById('global').addEventListener("click", (event) => {
    event.target.style.color = 'white';
    document.getElementById('default').style.color = 'grey';
    
    document.querySelector('.content').innerHTML = '<p>Loading...</p>';
    loadTableGlobal(globalData1, 'Valuation');

    document.querySelector('#sortRevenue').innerHTML = 'Valuation';
    document.querySelector('#sortProfit').textContent = 'Joined';

    document.querySelector('#sortRevenue').style.fontWeight = '600';
    document.querySelector('#sortRevenue').style.textDecoration = 'underline';

    document.querySelector('#sortProfit').style.fontWeight = '400';
    document.querySelector('#sortProfit').style.textDecoration = 'none';

    document.querySelector('#sortEmployee').style.display = 'none'
    document.querySelector('.sort').style.width = '200px'
})