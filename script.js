// Total memory size: 10 cells, 100 MB per cell
const MEMORY_CELLS = 10;
const CELL_SIZE_MB = 100;

// Global memory array: null for free, or process ID for allocated
const memoryState = Array(MEMORY_CELLS).fill(null);

// Process list
const processes = [];
let processCounter = 0;


// When the page loads, create the vertical memory table
document.addEventListener("DOMContentLoaded", () => {
  const memoryTable = document.querySelector("#memory-table tbody");

  for (let i = 0; i < MEMORY_CELLS; i++) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.id = `cell-${i}`;
    cell.textContent = `Cell ${i + 1}`;
    row.appendChild(cell);
    memoryTable.appendChild(row);
  }
});

function updateMemoryState(processObj) {
    // Mark each cell allocated to this process with the process id.
    for (let i = processObj.startIndex; i < processObj.startIndex + processObj.requiredCells; i++) {
      memoryState[i] = processObj.id;
    }
  }
  

function createProcessTable(processObj) {
    // Get the container where process tables should be added.
    const container = document.getElementById("process-tables-container");
    if (!container) {
      console.error("process-tables-container element not found in the DOM.");
      return;
    }
  
    // Create a new table element.
    const table = document.createElement("table");
    table.id = `process-table-${processObj.id}`;
    table.classList.add("process-table");
  
    const tbody = document.createElement("tbody");
  
    // Create rows based on the number of required cells.
    processObj.allocatedCells.forEach((globalIndex) => {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      // Now, label based on the global cell index rather than always "Cell 1"
      cell.textContent = `Cell ${globalIndex + 1}`;
      cell.classList.add("process-cell");
      row.appendChild(cell);
      tbody.appendChild(row);
    });
  
    table.appendChild(tbody);
    
    // Append the table to the container.
    container.appendChild(table);
    // HERE: store the table element in the process object for later access.
    processObj.tableElement = table;
  }
  
  

  document.getElementById("process-form").addEventListener("submit", function (e) {
    e.preventDefault();
  
    const processName = document.getElementById("process-name").value.trim();
    const processSizeMB = parseInt(document.getElementById("process-mb").value.trim(), 10);
  
    if (!processName || processSizeMB < 1) return;

    // Calculate the number of contiguous cells required
    const requiredCells = Math.ceil(processSizeMB / CELL_SIZE_MB);
  
    // Try to allocate contiguous memory for the process
    const startIndex = findContiguousMemory(requiredCells);

    if (startIndex === -1) {
  
      alert("Maximum process size is 100.");
      return;
    }
  
    // Reject a single process if it exceeds the maximum allowed size (1000 MB).
    if (processSizeMB > 1000) {
      alert("Error: A single process cannot exceed 100 MB.");
      return;
    }

  
    // Add the process to the queue, but defer memory allocation.
    const processId = processCounter++;
    const processObj = {
      id: processId,
      name: processName,
      sizeMB: processSizeMB,
      requiredCells: requiredCells,
      status: "Queued" // Processes start in the "Queued" state.
    };
    
    processObj.allocatedCells = Array.from({ length: requiredCells }, (_, i) => startIndex + i);
    processes.push(processObj);
  
    updateMemoryState(processObj);
  
    // Update the process list display (list or row) immediately
    // addProcessRow(processObj);
  
    // Also, create the visual process table (local to this process) immediately.
    createProcessTable(processObj);
    // Update the process list UI immediately.
    addProcessRow(processObj);
  
    // Clear form input fields.
    e.target.reset();
  });
  
  
  document.getElementById("simulate-btn").addEventListener("click", function () {
    processes.forEach((processObj) => {
      // If the process is already allocated, skip it.
      if (processObj.status === "Allocated" || processObj.status === "Processed") return;

  
  
      // Try to allocate memory for the process.
      const startIndex = findContiguousMemory(processObj.requiredCells);
        

      if (startIndex === -1) {
        // If memory is unavailable, keep it in the queue.
        processObj.status = "Waiting"
        updateProcessRow(processObj);
        has_waiting = true;
      } else {


        // Allocate memory and update its status.
        processObj.startIndex = startIndex;
        processObj.allocatedCells = Array.from(
          { length: processObj.requiredCells },
          (_, i) => startIndex + i
        );
  
        for (let i = processObj.startIndex; i < processObj.startIndex + processObj.requiredCells; i++) {
          memoryState[i] = processObj.id;
        }
  
        processObj.status = "Allocated";
        updateProcessRow(processObj);
  
        // Start the progress animation on the memory file.
        simulateProcessing(processObj);
      }
    });
  });
  
  
  

// Find a block of contiguous free memory that can fit the required cells
function findContiguousMemory(requiredCells) {
  let count = 0;
  let start = -1;

  for (let i = 0; i < MEMORY_CELLS; i++) {
    if (memoryState[i] === null) {
      if (count === 0) start = i;
      count++;
      if (count === requiredCells) {
        return start;
      }
    } else {
      count = 0;
      start = -1;
    }
  }

  return -1;
}

// Allocate memory for a process
function allocateMemory(processObj) {
  for (let i = processObj.startIndex; i < processObj.startIndex + processObj.requiredCells; i++) {
    memoryState[i] = processObj.id;
    const cell = document.getElementById(`cell-${i}`);
    cell.classList.add("allocated");
    cell.textContent = processObj.name;
    simulateProcessing(processObj);
  }
}


function simulateProcessing(processObj) {
    const totalTime = processObj.requiredCells * 3000;
  
    processObj.allocatedCells.forEach((cellIndex) => {
      const cell = document.getElementById(`cell-${cellIndex}`);
      if (!cell) return;
  
      cell.textContent = processObj.name;
      cell.style.position = "relative";
  
      const progressBar = document.createElement("div");
      progressBar.className = "progress-bar";
      progressBar.style.width = "0%";
      progressBar.style.height = "100%";
      progressBar.style.position = "absolute";
      progressBar.style.bottom = "0";
      progressBar.style.left = "0";
      progressBar.style.backgroundColor = "rgba(28, 148, 92, 0.6)";
      progressBar.style.transition = `width ${totalTime}ms linear`;
  
      cell.appendChild(progressBar);
      progressBar.offsetWidth; // force reflow
  
      setTimeout(() => {
        progressBar.style.width = "100%";
      }, 50);
    });
  
    // After processing, clear memory and retry allocation.
    setTimeout(() => {
      processObj.status = "Processed";
      updateProcessRow(processObj);
  
      processObj.allocatedCells.forEach((cellIndex) => {
        const cell = document.getElementById(`cell-${cellIndex}`);
        if (cell) {
          const progressBar = cell.querySelector(".progress-bar");
          if (progressBar) cell.removeChild(progressBar);
          cell.textContent = `Cell ${cellIndex + 1}`;
          cell.classList.add("processed");
        }
        memoryState[cellIndex] = null; // Free the memory.
      });
  
      // Retry allocation for queued processes.

      let has_waiting = false;
      processes.forEach((queuedProcess) => {
        if (queuedProcess.status === "Waiting") {
          const startIndex = findContiguousMemory(queuedProcess.requiredCells);
          if (startIndex !== -1) {
            queuedProcess.startIndex = startIndex;
            queuedProcess.allocatedCells = Array.from(
              { length: queuedProcess.requiredCells },
              (_, i) => startIndex + i
            );
  
            for (let i = queuedProcess.startIndex; i < queuedProcess.startIndex + queuedProcess.requiredCells; i++) {
              memoryState[i] = queuedProcess.id;
            }
  
            queuedProcess.status = "Allocated";
            updateProcessRow(queuedProcess);
            simulateProcessing(queuedProcess); // Start its animation.
          }

          return

          
        }
      });


    }, totalTime);
  }

// Add a process row to the process table
function addProcessRow(processObj) {
  const tbody = document.querySelector("#process-table tbody");
  const row = document.createElement("tr");
  row.id = `process-row-${processObj.id}`;

  row.innerHTML = `
    <td>${processObj.name}</td>
    <td>${processObj.sizeMB} MB</td>
    <td>${processObj.status}</td>
  `;

  tbody.appendChild(row);
}

function updateProcessRow(processObj) {
    // Locate the row for this process in the process table.
    const row = document.getElementById(`process-row-${processObj.id}`);
    if (row) {
      // Update the status cell (assumed to be the third cell)
      row.cells[2].textContent = processObj.status;
    }
}
  
