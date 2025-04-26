const processes = [];

    function togglePriorityInput() {
        const selected = document.getElementById('algorithm').value;
        const priorityInput = document.getElementById('priorityInput');
        const quantumInput = document.getElementById('quantumInput'); // Use the wrapper div's ID here

        // Toggle Priority Input
        if (selected === 'Preemptive Priority') {
            priorityInput.style.display = 'block';
        } else {
            priorityInput.style.display = 'none';
        }

        // Toggle Quantum Input
        if (selected === 'RoundRobin') {
            quantumInput.style.display = 'block';
        } else {
            quantumInput.style.display = 'none';
        }
    }


    function addProcess() {
        const id = `P${processes.length + 1}`;
        document.getElementById('pid').value = id; // update the input visually
    
        const arrivalTime = parseInt(document.getElementById('arrival').value);
        const burstTime = parseInt(document.getElementById('burst').value);
        const priorityInput = document.getElementById('priority');
        const priority = priorityInput && priorityInput.value !== '' ? parseInt(priorityInput.value) : undefined;
    
        if (isNaN(arrivalTime) || isNaN(burstTime)) {
            alert("Please enter valid arrival and burst times.");
            return;
        }
    
        const process = { id, arrivalTime, burstTime };
        if (priority !== undefined && document.getElementById('algorithm').value === 'Preemptive Priority') {
            process.priority = priority;
        }
    
        processes.push(process);
        document.getElementById('arrival').value = '';
        document.getElementById('burst').value = '';
        if (priorityInput) priorityInput.value = '';
    
        updateInputTable();
    
        // Prepare the next process ID
        document.getElementById('pid').value = `P${processes.length + 1}`;
    }

    window.onload = () => {
        document.getElementById('pid').value = 'P1';
    };

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
        const quantum = parseInt(document.getElementById('quantum').value);
        const gantt = [];
        let result = [];
    
        const clone = JSON.parse(JSON.stringify(processes));
    
        if (algo === 'FCFS') result = calculateFCFS(clone, gantt);
        if (algo === 'SJF') result = calculateSJF(clone, gantt);
        if (algo === 'SRTF') result = calculateSRTF(clone, gantt);
        if (algo === 'RoundRobin') result = calculateRR(clone, gantt, quantum);
        if (algo === 'Preemptive Priority') result = calculatePriority(clone, gantt);
    
        renderTable(result);
        renderGantt(gantt);
        renderAverages(result);
    
        // Reset everything after displaying the results
        processes.length = 0; // Clear process array
        document.getElementById('inputTable').querySelector('tbody').innerHTML = ''; // Clear input table
        document.getElementById('pid').value = 'P1'; // Reset process ID
        document.getElementById('arrival').value = '';
        document.getElementById('burst').value = '';
        document.getElementById('priority').value = '';
        document.getElementById('algorithm').value = ''; // Reset algorithm selection
        document.getElementById('quantum').value = '1'; // Reset quantum
        document.getElementById('priorityInput').style.display = 'none'; // Hide priority input again
    }

    window.onload = () => {
        document.getElementById('pid').value = 'P1';
    };    
    

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

    function calculateSRTF(processes, gantt) {
        const n = processes.length;
        const remaining = processes.map(p => p.burstTime); // Tracks remaining burst time
        const arrivalTimes = processes.map(p => p.arrivalTime); // Tracks arrival times
        let currentTime = 0;
        const completed = [];
        const done = Array(n).fill(false); // Keeps track of completed processes
        let readyQueue = []; // Holds processes that are ready to be executed
    
        // While there are processes left to complete
        while (completed.length < n) {
            // Add processes that have arrived by the current time to the ready queue
            for (let i = 0; i < n; i++) {
                if (!done[i] && processes[i].arrivalTime <= currentTime && !readyQueue.includes(i)) {
                    readyQueue.push(i);
                }
            }
    
            // If the ready queue is empty, move time forward (no processes are ready to execute)
            if (readyQueue.length === 0) {
                currentTime++;
                continue;
            }
    
            // Select the process with the shortest remaining time (preemption happens here)
            let idx = -1;
            let minRemainingTime = Infinity;
            for (let i = 0; i < readyQueue.length; i++) {
                const processIdx = readyQueue[i];
                if (remaining[processIdx] < minRemainingTime) {
                    minRemainingTime = remaining[processIdx];
                    idx = processIdx;
                }
            }
            // Execute the selected process for 1 unit of time
            gantt.push({ id: processes[idx].id, time: currentTime });
            remaining[idx]--;
    
            // If the process is finished, mark it as done
            if (remaining[idx] === 0) {
                done[idx] = true;
                const finishTime = currentTime + 1;
                const turnaroundTime = finishTime - processes[idx].arrivalTime;
                const waitingTime = turnaroundTime - processes[idx].burstTime;
                completed.push({ ...processes[idx], startTime: currentTime - processes[idx].burstTime + 1, finishTime, turnaroundTime, waitingTime });
                readyQueue = readyQueue.filter(i => i !== idx); // Remove finished process from ready queue
            }
            // Move the current time forward
            currentTime++;
        }
        return completed;
    }
    

    function calculateRR(processes, gantt, quantum) {
        const n = processes.length;
        const remaining = processes.map(p => p.burstTime);
        const arrival = processes.map(p => p.arrivalTime);
        const isDone = Array(n).fill(false);
        const startTimes = {};
        const result = [];
        const readyQueue = [];
    
        let currentTime = Math.min(...arrival);
        let completed = 0;
    
        while (completed < n) {
            // Add all processes that have arrived by currentTime and are not done
            for (let i = 0; i < n; i++) {
                if (arrival[i] <= currentTime && !isDone[i] && !readyQueue.includes(i)) {
                    readyQueue.push(i);
                }
            }
    
            if (readyQueue.length === 0) {
                currentTime++;
                continue;
            }
    
            const index = readyQueue.shift();
            const execTime = Math.min(quantum, remaining[index]);
    
            if (startTimes[processes[index].id] === undefined) {
                startTimes[processes[index].id] = currentTime;
            }
    
            // Add this time slice to Gantt chart
            for (let t = 0; t < execTime; t++) {
                gantt.push({ id: processes[index].id, time: currentTime + t });
            }
    
            currentTime += execTime;
            remaining[index] -= execTime;
    
            // Check for new arrivals during execution
            for (let i = 0; i < n; i++) {
                if (arrival[i] > currentTime - execTime && arrival[i] <= currentTime && !isDone[i] && !readyQueue.includes(i) && i !== index) {
                    readyQueue.push(i);
                }
            }
    
            if (remaining[index] > 0) {
                // Re-add the current process to the end of the queue
                readyQueue.push(index);
            }
            else {
                isDone[index] = true;
                completed++;
    
                const finishTime = currentTime;
                const turnaroundTime = finishTime - processes[index].arrivalTime;
                const waitingTime = turnaroundTime - processes[index].burstTime;
    
                result.push({
                    ...processes[index],
                    startTime: startTimes[processes[index].id],
                    finishTime,
                    turnaroundTime,
                    waitingTime
                });
            }
        }
        return result;
    }
    
    
    function calculatePriority(processes, gantt) {
        const n = processes.length;
        const remaining = processes.map(p => p.burstTime);
        const priorities = processes.map(p => p.priority);
        const arrival = processes.map(p => p.arrivalTime);
        const isDone = Array(n).fill(false);
        const result = [];
        const startTimes = {};
        let currentTime = 0;
        let completed = 0;
    
        while (completed < n) {
            let idx = -1;
            let highestPriority = Infinity;
    
            for (let i = 0; i < n; i++) {
                if (!isDone[i] && arrival[i] <= currentTime && remaining[i] > 0) {
                    if (priorities[i] < highestPriority) {
                        highestPriority = priorities[i];
                        idx = i;
                    }
                }
            }
            if (idx === -1) {
                currentTime++;
                continue;
            }
            // Record first start time
            if (startTimes[processes[idx].id] === undefined) {
                startTimes[processes[idx].id] = currentTime;
            }

            gantt.push({ id: processes[idx].id, time: currentTime });
    
            remaining[idx]--;
            currentTime++;
    
            if (remaining[idx] === 0) {
                const finishTime = currentTime;
                const turnaroundTime = finishTime - processes[idx].arrivalTime;
                const waitingTime = turnaroundTime - processes[idx].burstTime;
                isDone[idx] = true;
                completed++;
    
                result.push({
                    ...processes[idx],
                    startTime: startTimes[processes[idx].id],
                    finishTime,
                    turnaroundTime,
                    waitingTime
                });
            }
        }
        return result;
    }      