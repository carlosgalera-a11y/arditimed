const DATA = {
    conditions: [
        { id: "cv", name: "Cardiovascular", icon: "monitor_heart", type: "category" },
        { id: "resp", name: "Respiratory", icon: "pulmonology", type: "category" },
        { id: "neuro", name: "Neurological", icon: "neurology", type: "category" },
        { id: "trauma", name: "Trauma", icon: "orthopedics", type: "category" },
        { id: "tox", name: "Toxicology", icon: "skull", type: "category" }
    ],
    items: {
        "cv": [
            { id: "acs", name: "Acute coronary syndrome (ACS) - Myocardial infarction (MI)", type: "detail" },
            { id: "cardiac_arrest", name: "Cardiac Arrest", type: "detail" },
            { id: "pulm_edema", name: "Acute hypertensive pulmonary edema", type: "detail" }
        ],
        "resp": [
            { id: "asthma", name: "Asthma Exacerbation", type: "detail" },
            { id: "anaphylaxis", name: "Anaphylaxis", type: "detail" }
        ]
    },
    details: {
        "acs": {
            title: "Acute Coronary Syndrome (ACS)",
            doses: [
                { name: "Aspirin", desc: "Antiplatelet", doseText: "162 - 325 mg", route: "PO", math: "" },
                { name: "Nitroglycerin", desc: "Vasodilator", doseText: "0.4 mg", route: "SL", math: "" },
                { name: "Heparin", desc: "Anticoagulant (Max 4000 Units)", calc: "min(weight * 60, 4000)", unit: "Units", route: "IV Push" },
                { name: "Fentanyl", desc: "For persistent pain", calc: "weight * 1", unit: "mcg", route: "IV Push" }
            ],
            equipment: [
                { name: "IV Access", desc: "Peripheral gauge recommended", calc: "weight > 30 ? '18G or 20G' : '22G'", unit: "" }
            ]
        },
        "cardiac_arrest": {
            title: "Cardiac Arrest",
            doses: [
                { name: "Epinephrine (1:10,000)", desc: "Vasopressor", calc: "Math.min(weight * 0.01, 1).toFixed(2)", unit: "mg", route: "IV/IO" },
                { name: "Amiodarone", desc: "Antiarrhythmic", doseText: "300 mg", route: "IV/IO Push", math: "" },
                { name: "Defibrillation Energy", desc: "Biphasic", calc: "Math.min(weight * 2, 200)", unit: "Joules", route: "Shock" }
            ],
            equipment: [
                { name: "Endotracheal Tube", calc: "weight > 50 ? '7.5 - 8.0' : (weight/4)+4", unit: "mm" },
                { name: "Laryngoscope Blade", desc: "Mac preferred", calc: "weight > 30 ? 'Mac 3 or 4' : 'Miller 2'", unit: "" }
            ]
        },
        "anaphylaxis": {
            title: "Anafilaxia",
            doses: [
                { name: "Epinefrina (1:1.000)", calc: "weight * 0.01", unit: "mg", route: "IM" }
            ]
        }
    }
};

let currentWeight = 80.0;
let historyStack = ['home'];

document.addEventListener('DOMContentLoaded', () => {
    updateWeightUI();
    renderHome();

    // Setup Tabs
    document.querySelectorAll('#homeTabs .tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('#homeTabs .tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            // Currently we only have dummy data for conditions
            renderHome();
        });
    });

    document.querySelectorAll('#detailTabs .tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('#detailTabs .tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            let detailId = document.getElementById('mainContent').dataset.currentDetail;
            renderDetailList(detailId, e.target.dataset.tab);
        });
    });

    // Navigation Buttons
    document.getElementById('navBack').addEventListener('click', () => goBack());
    document.getElementById('navHome').addEventListener('click', () => goHome());

    // Weight Modal Logic
    document.getElementById('weightBtn').addEventListener('click', () => {
        document.getElementById('weightInput').value = currentWeight;
        document.getElementById('weightModal').classList.remove('hidden');
    });
    
    document.getElementById('closeWeightModal').addEventListener('click', () => {
        document.getElementById('weightModal').classList.add('hidden');
    });

    document.getElementById('saveWeightBtn').addEventListener('click', () => {
        let w = parseFloat(document.getElementById('weightInput').value);
        if (w > 0) {
            currentWeight = w;
            updateWeightUI();
            document.getElementById('weightModal').classList.add('hidden');
            
            // Re-render current view to recalculate doses
            let currentView = historyStack[historyStack.length - 1];
            if (currentView.startsWith('detail:')) {
                let id = currentView.split(':')[1];
                let activeTab = document.querySelector('#detailTabs .active').dataset.tab;
                renderDetailList(id, activeTab);
            }
        }
    });
});

function updateWeightUI() {
    document.getElementById('weightValKg').innerText = currentWeight.toFixed(1);
    document.getElementById('weightValLbs').innerText = (currentWeight * 2.20462).toFixed(1);
}

function pushView(view) {
    if (historyStack[historyStack.length - 1] !== view) {
        historyStack.push(view);
    }
}

function goBack() {
    if (historyStack.length > 1) {
        historyStack.pop();
        let prev = historyStack[historyStack.length - 1];
        if (prev === 'home') renderHome();
        else if (prev.startsWith('cat:')) renderCategory(prev.split(':')[1]);
        else if (prev.startsWith('detail:')) renderDetail(prev.split(':')[1]);
    }
}

function goHome() {
    historyStack = ['home'];
    renderHome();
}

// ---------------- VIEWS ----------------

function renderHome() {
    document.getElementById('homeTabs').classList.remove('hidden');
    document.getElementById('detailTabs').classList.add('hidden');
    document.getElementById('topHeader').style.borderRadius = "0 0 24px 24px";
    document.getElementById('headerContent').innerHTML = `
        <div class="search-box">
            <span class="material-symbols-outlined search-icon">search</span>
            <input type="text" placeholder="Search" />
        </div>
    `;

    let html = '<div class="content-list">';
    DATA.conditions.forEach((c, index) => {
        html += `
            <div class="list-item slide-in" style="animation-delay: ${index * 0.05}s" onclick="openCategory('${c.id}')">
                <span class="material-symbols-outlined list-icon">${c.icon}</span>
                <span class="list-title">${c.name}</span>
            </div>
        `;
    });
    html += '</div>';
    document.getElementById('mainContent').innerHTML = html;
}

window.openCategory = function(catId) {
    pushView('cat:' + catId);
    renderCategory(catId);
}

function renderCategory(catId) {
    let cat = DATA.conditions.find(c => c.id === catId);
    if(!cat) return;

    document.getElementById('topHeader').style.borderRadius = "0 0 24px 24px";
    document.getElementById('headerContent').innerHTML = `
        <div style="display:flex; align-items:center; color:white; gap: 12px; margin-bottom: 8px;">
            <span class="material-symbols-outlined" style="font-size: 28px;">${cat.icon}</span>
            <h2 style="font-size: 20px; margin:0;">${cat.name}</h2>
        </div>
        <div class="search-box" style="margin-top: 12px;">
            <span class="material-symbols-outlined search-icon">search</span>
            <input type="text" placeholder="Filter ${cat.name}..." />
        </div>
    `;
    
    let items = DATA.items[catId] || [];
    let html = '<div class="content-list">';
    if(items.length === 0) {
        html += `<p style="padding:20px; color:#666; text-align:center;">No protocols in this demo database.</p>`;
    }
    items.forEach((item, index) => {
        html += `
            <div class="list-item slide-in" style="animation-delay: ${index * 0.05}s" onclick="openDetail('${item.id}')">
                <span class="list-title" style="flex:1;">${item.name}</span>
                <span class="material-symbols-outlined" style="color:#d1d5db;">chevron_right</span>
            </div>
        `;
    });
    html += '</div>';
    document.getElementById('mainContent').innerHTML = html;
}

window.openDetail = function(id) {
    pushView('detail:' + id);
    renderDetail(id);
}

function renderDetail(id) {
    let detail = DATA.details[id];
    if(!detail) {
        alert("Not implemented in this demo.");
        goBack();
        return;
    }

    document.getElementById('homeTabs').classList.add('hidden');
    document.getElementById('detailTabs').classList.remove('hidden');
    document.getElementById('topHeader').style.borderRadius = "0";
    
    document.getElementById('headerContent').innerHTML = `
        <div style="display:flex; align-items:center; color:white; gap: 12px; padding: 4px 0;">
            <h2 style="font-size: 20px; margin:0; line-height:1.2;">${detail.title}</h2>
        </div>
    `;

    document.getElementById('mainContent').dataset.currentDetail = id;
    
    // Reset tabs
    document.querySelectorAll('#detailTabs .tab').forEach(t => t.classList.remove('active'));
    document.querySelector('#detailTabs .tab[data-tab="doses"]').classList.add('active');

    renderDetailList(id, 'doses');
}

function renderDetailList(id, tab) {
    let detail = DATA.details[id];
    let html = '<div class="detail-content-list">';
    
    let list = tab === 'doses' ? detail.doses : detail.equipment;
    
    if(!list || list.length === 0) {
        html += `<p style="text-align:center; padding: 20px; color: #888;">No data available.</p>`;
    } else {
        list.forEach((item, index) => {
            let val = item.doseText || "";
            if (item.calc) {
                try {
                    // Safe eval wrapper just for standard math and 'weight' variable.
                    let calcFunc = new Function('weight', 'return ' + item.calc);
                    val = calcFunc(currentWeight) + " " + (item.unit || "");
                } catch(e) {
                    val = "Calculation Error";
                }
            }

            html += `
                <div class="detail-card fade-in">
                    <div class="card-header">
                        <h3>${item.name}</h3>
                        ${item.route ? `<span class="route-badge">${item.route}</span>` : ''}
                    </div>
                    ${item.desc ? `<p class="item-desc">${item.desc}</p>` : ''}
                    <div class="calculated-dose">
                        ${val}
                    </div>
                </div>
            `;
        });
    }

    html += '</div>';
    document.getElementById('mainContent').innerHTML = html;
}
