const processes = [];

function togglePriorityInput() {
    const selected = document.getElementById('algorithm').value;
    const priorityInput = document.getElementById('non-priorityInput');

    // Toggle Priority Input
    if (selected === 'Non-Preemptive Priority') {
        priorityInput.style.display = 'block';
    } else {
        priorityInput.style.display = 'none';
    }
}

function addProcess() {
    const id = `P${processes.length + 1}`;
    const arrivalTime = parseInt(document.getElementById('arrival').value);
    const burstTime = parseInt(document.getElementById('burst').value);
    const priorityInput = document.getElementById('non-priority');
    const priority = priorityInput && priorityInput.value !== '' ? parseInt(priorityInput.value) : undefined;

    if (isNaN(arrivalTime) || isNaN(burstTime)) {
        alert("Please enter valid arrival and burst times.");
        return;
    }

    const process = { id, arrivalTime, burstTime };
    if (priority !== undefined && document.getElementById('algorithm').value === 'Non-Preemptive Priority') {
        process.priority = priority;
    }

    processes.push(process);
    document.getElementById('arrival').value = '';
    document.getElementById('burst').value = '';
    if (priorityInput) priorityInput.value = '';

    updateInputTable();

    // Update the process ID for the next process
    document.getElementById('pid').value = `P${processes.length + 1}`;
}

function updateInputTable() {
    const tbody = document.querySelector("#inputTable tbody");
    tbody.innerHTML = '';
    processes.forEach(p => {
        tbody.innerHTML += `
            <tr>
                <td>${p.id}</td>
                <td>${p.arrivalTime}</td>
                <td>${p.burstTime}</td>
                <td>${p.priority ?? '-'}</td>
            </tr>
        `;
    });
}

function runScheduling() {
    const algo = document.getElementById('algorithm').value;
    const gantt = [];
    let result = [];

    const clone = JSON.parse(JSON.stringify(processes));

    if (algo === 'FCFS') result = calculateFCFS(clone, gantt);
    if (algo === 'SJF') result = calculateSJF(clone, gantt);
    if (algo === 'Non-Preemptive Priority') result = calculatePriority(clone, gantt);

    renderTable(result);
    renderGantt(gantt);
    renderAverages(result);

    // Reset everything after displaying the results
    processes.length = 0; // Clear process array
    document.getElementById('inputTable').querySelector('tbody').innerHTML = ''; // Clear input table
    document.getElementById('pid').value = `P1`; // Reset process ID
    document.getElementById('arrival').value = '';
    document.getElementById('burst').value = '';
    document.getElementById('priority').value = '';
    document.getElementById('algorithm').value = ''; // Reset algorithm selection
    document.getElementById('non-priorityInput').style.display = 'none'; // Hide priority input again
}

function renderTable(data) {
    const tbody = document.querySelector("#resultTable tbody");
    tbody.innerHTML = "";
    data.forEach(p => {
        tbody.innerHTML += `
            <tr>
                <td>${p.id}</td>
                <td>${p.arrivalTime}</td>
                <td>${p.burstTime}</td>
                <td>${p.startTime}</td>
                <td>${p.finishTime}</td>
                <td>${p.waitingTime}</td>
                <td>${p.turnaroundTime}</td>
            </tr>
        `;
    });
}

function renderGantt(data) {
    const chart = document.getElementById("ganttChart");
    chart.innerHTML = "";
    data.forEach(p => {
        chart.innerHTML += `<div><b>${p.id}</b><br/><small>${p.time}</small></div>`;
    });
}

function renderAverages(data) {
    const totalWaitingTime = data.reduce((acc, p) => acc + p.waitingTime, 0);
    const totalTurnaroundTime = data.reduce((acc, p) => acc + p.turnaroundTime, 0);

    const avgWaitingTime = totalWaitingTime / data.length;
    const avgTurnaroundTime = totalTurnaroundTime / data.length;

    const avgElement = document.getElementById("averages");
    avgElement.innerHTML = `
        <h3>Average Waiting Time: ${avgWaitingTime.toFixed(2)} ms</h3>
        <h3>Average Turnaround Time: ${avgTurnaroundTime.toFixed(2)} ms</h3>
    `;
}

function calculateFCFS(processes, gantt) {
    const n = processes.length;
    let currentTime = 0;
    const result = [];

    processes.sort((a, b) => a.arrivalTime - b.arrivalTime); // Sort processes by arrival time

    processes.forEach((p) => {
        // If the process arrives after the current time, advance the time to its arrival time
        if (currentTime < p.arrivalTime) {
            currentTime = p.arrivalTime;
        }

        // Record the start time and execute the process
        const startTime = currentTime;
        const finishTime = startTime + p.burstTime;
        const turnaroundTime = finishTime - p.arrivalTime;
        const waitingTime = turnaroundTime - p.burstTime;

        // Add the process to the result
        result.push({
            ...p,
            startTime,
            finishTime,
            turnaroundTime,
            waitingTime,
        });

        // Add to Gantt chart
        for (let t = startTime; t < finishTime; t++) {
            gantt.push({ id: p.id, time: t });
        }

        // Update the current time
        currentTime = finishTime;
    });

    return result;
}

function calculateSJF(processes, gantt) {
    const result = [];
    let currentTime = 0;
    let completed = 0;
    const n = processes.length;
    const isCompleted = Array(n).fill(false);

    while (completed < n) {
        let idx = -1;
        let minBurst = Infinity;

        for (let i = 0; i < n; i++) {
            const p = processes[i];
            if (!isCompleted[i] && p.arrivalTime <= currentTime && p.burstTime < minBurst) {
                minBurst = p.burstTime;
                idx = i;
            }
        }

        if (idx === -1) {
            currentTime++; // No process has arrived yet
        } else {
            const p = processes[idx];
            const startTime = currentTime;
            const finishTime = startTime + p.burstTime;
            const turnaroundTime = finishTime - p.arrivalTime;
            const waitingTime = turnaroundTime - p.burstTime;

            result.push({
                ...p,
                startTime,
                finishTime,
                turnaroundTime,
                waitingTime,
            });

            for (let t = startTime; t < finishTime; t++) {
                gantt.push({ id: p.id, time: t });
            }

            currentTime = finishTime;
            isCompleted[idx] = true;
            completed++;
        }
    }

    return result;
}


function calculatePriority(processes, gantt) {
    const result = [];
    let currentTime = 0;
    let completed = 0;
    const n = processes.length;
    const isCompleted = Array(n).fill(false);

    while (completed < n) {
        let idx = -1;
        let highestPriority = Infinity;

        for (let i = 0; i < n; i++) {
            const p = processes[i];
            if (!isCompleted[i] && p.arrivalTime <= currentTime && p.priority < highestPriority) {
                highestPriority = p.priority;
                idx = i;
            }
        }

        if (idx === -1) {
            currentTime++; // No process is ready yet
        } else {
            const p = processes[idx];
            const startTime = currentTime;
            const finishTime = startTime + p.burstTime;
            const turnaroundTime = finishTime - p.arrivalTime;
            const waitingTime = turnaroundTime - p.burstTime;

            result.push({
                ...p,
                startTime,
                finishTime,
                turnaroundTime,
                waitingTime,
            });

            for (let t = startTime; t < finishTime; t++) {
                gantt.push({ id: p.id, time: t });
            }

            currentTime = finishTime;
            isCompleted[idx] = true;
            completed++;
        }
    }

    return result;
}


window.onload = () => {
    document.getElementById('pid').value = `P1`; // Start with P1 when the page loads
};
