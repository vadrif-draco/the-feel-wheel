let feels = null;

window.onload = function () {
    loadFeelsArray();
    generateWheelRegionsCSS();
    generateWheelRegionsHTML();
}

// Loads the "feels" array from localStorage if exists; otherwise generates and stores it for the first time
function loadFeelsArray() {
    feels = JSON.parse(localStorage.getItem("feels")); // Returns null if JSON string to parse is itself null
    if (feels == null) {
        feels = Array(7);
        feels[0] = Array.from(Array(6), () => Array.from(Array(2), _ => false));
        feels[1] = Array.from(Array(8), () => Array.from(Array(2), _ => false));
        feels[2] = Array.from(Array(4), () => Array.from(Array(2), _ => false));
        feels[3] = Array.from(Array(6), () => Array.from(Array(2), _ => false));
        feels[4] = Array.from(Array(9), () => Array.from(Array(2), _ => false));
        feels[5] = Array.from(Array(4), () => Array.from(Array(2), _ => false));
        feels[6] = Array.from(Array(4), () => Array.from(Array(2), _ => false));
        localStorage.setItem("feels", JSON.stringify(feels));
    }
}

// The wheel has three levels of "feels", L1 being the innermost level, L3 being the outermost, each having interactable regions
// Generates the "regions" clip paths for each feeling in L2 and L3
function generateWheelRegionsCSS() {
    const L3ArcIncrement = 1 / 82 * 2 * Math.PI;
    const L2ArcIncrement = 1 / 41 * 2 * Math.PI;
    L1PrevArcStart = - Math.PI / 2;
    L2PrevArcStart = - Math.PI / 2;
    L3PrevArcStart = - Math.PI / 2;
    css = '';
    feels.forEach((L1, L1i) => {
        L1.forEach((L2, L2i) => {
            L2.forEach((_, L3i) => {
                L3NextArcStart = L3PrevArcStart + L3ArcIncrement;
                css += `[id="${L1i}-${L2i}-${L3i}"] { clip-path: polygon(${generatePartialSectorArea(L3PrevArcStart, L3NextArcStart, 0.285, 0.442, 2, 3)}); }`;
                L3PrevArcStart = L3NextArcStart;
            });
            L2NextArcStart = L2PrevArcStart + L2ArcIncrement;
            css += `[id="${L1i}-${L2i}"] { clip-path: polygon(${generatePartialSectorArea(L2PrevArcStart, L2NextArcStart, 0.14, 0.282, 3, 4)}); }`;
            L2PrevArcStart = L2NextArcStart;
        });
        L1NextArcStart = L1PrevArcStart + L1.length / 41 * 2 * Math.PI;
        css += `[id="${L1i}"] { clip-path: polygon(${generatePartialSectorArea(L1PrevArcStart, L1NextArcStart, 0, 0.1375, 1, 10)}); }`;
        L1PrevArcStart = L1NextArcStart;
    });
    style = document.createElement('style');
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
}

// Used for generating the wheel regions clip paths which are approximations of partial sectors;
// Given the arc and radius start and end information of the sector as well as number of points for the inner and outer arcs
// The values assume a circle of unit diameter (i.e., all values are percentages)
function generatePartialSectorArea(arcStart, arcEnd, radiusStart, radiusEnd, numOfInnerArcPoints, numOfOuterArcPoints) {
    res = '';
    arcStart -= 0.001;
    arcEnd += 0.001;
    numOfInnerArcPoints = Math.max(numOfInnerArcPoints, 1);
    numOfOuterArcPoints = Math.max(numOfOuterArcPoints, 1);

    // Equidistant points in inner arc from inner arc start to end
    for (let i = 0; i < numOfInnerArcPoints; i++) {
        arcStartWeight = numOfInnerArcPoints - i - 1;
        arcEndWeight = i;
        arcIntermediate = (arcStart * arcStartWeight + arcEnd * arcEndWeight) / Math.max(numOfInnerArcPoints - 1, 1);
        res += `${(0.5 + radiusStart * Math.cos(arcIntermediate)) * 100}% ${(0.5 + radiusStart * Math.sin(arcIntermediate)) * 100}%, `;
    }

    // Equidistant points in outer arc from outer arc end to start (needs to be reversed for polygon continuity)
    for (let i = 0; i < numOfOuterArcPoints; i++) {
        arcStartWeight = i;
        arcEndWeight = numOfOuterArcPoints - i - 1;
        arcIntermediate = (arcStart * arcStartWeight + arcEnd * arcEndWeight) / Math.max(numOfOuterArcPoints - 1, 1);
        res += `${(0.5 + radiusEnd * Math.cos(arcIntermediate)) * 100}% ${(0.5 + radiusEnd * Math.sin(arcIntermediate)) * 100}%, `;
    }

    return res.slice(0, -2);
}

// This is a DFS traversal of L1, L2, and L3 to stack HTML elements of the wheel image (clipped by the previous CSS function) atop each other
function generateWheelRegionsHTML() {
    stack = document.getElementById("img-stack");
    feels.forEach((L1, L1i) => {
        L1.forEach((L2, L2i) => {
            L2.forEach((_, L3i) => {
                stack.insertAdjacentHTML("beforeend", `<img src="wheel.png" id="${L1i}-${L2i}-${L3i}" class="clip" onclick="toggleL3(${L1i},${L2i},${L3i})">`);
                refreshStyle(stack.lastChild);
            })
            stack.insertAdjacentHTML("beforeend", `<img src="wheel.png" id="${L1i}-${L2i}" class="clip" onclick="toggleL2(${L1i},${L2i})">`);
            refreshStyle(stack.lastChild);
        })
        stack.insertAdjacentHTML("beforeend", `<img src="wheel.png" id="${L1i}" class="clip" onclick="toggleL1(${L1i})">`);
        refreshStyle(stack.lastChild);
    });
}

// Toggles L3 element, then refreshes its style, and optionally its L2 and L1 parents'
function toggleL3(L1i, L2i, L3i, refreshL2 = true, refreshL1 = true) {
    feels[L1i][L2i][L3i] = !feels[L1i][L2i][L3i];
    localStorage.setItem("feels", JSON.stringify(feels));
    refreshStyle(document.getElementById(`${L1i}-${L2i}-${L3i}`));
    if (refreshL2) refreshStyle(document.getElementById(`${L1i}-${L2i}`));
    if (refreshL1) refreshStyle(document.getElementById(`${L1i}`));
}

// Toggles L2 element (via toggling its children), then refreshes its and their styles, and optionally its L1 parent's
function toggleL2(L1i, L2i, refreshL1 = true) {
    feels[L1i][L2i].forEach((_, L3i) => toggleL3(L1i, L2i, L3i, false, false));
    localStorage.setItem("feels", JSON.stringify(feels));
    refreshStyle(document.getElementById(`${L1i}-${L2i}`));
    if (refreshL1) refreshStyle(document.getElementById(`${L1i}`));
}

// Toggles L3 element (via toggling its children and grandchildren), then refreshes its style
function toggleL1(L1i) {
    feels[L1i].forEach((_, L2i) => toggleL2(L1i, L2i, false));
    localStorage.setItem("feels", JSON.stringify(feels));
    refreshStyle(document.getElementById(`${L1i}`));
}

// Refreshes the style of the element to be consistent with its corresponding state in the feels array
function refreshStyle(element) {
    levels = element.id.split('-')
    ratio = 0;
    switch (levels.length) {
        case 3:
            ratio = feels[levels[0]][levels[1]][levels[2]] ? 1 : 0;
            break;
        case 2:
            ratio = feels[levels[0]][levels[1]].filter(Boolean).length / feels[levels[0]][levels[1]].length;
            break;
        case 1:
            ratio = feels[levels[0]].flat().filter(Boolean).length / feels[levels[0]].flat().length;
            break;
        default:
            break;
    }
    element.style.opacity = 1.0 * ratio + 0.5 * (1 - ratio);
    element.style.filter = `saturate(${1.0 * ratio + 0.25 * (1 - ratio)})`;
    element.style.zIndex = (ratio > 0.5) ? "2" : "1";
    if (element.parentNode.querySelector(":hover") == element) {
        element.classList.add("nohover");
        element.addEventListener("mouseleave", function handler() {
            element.classList.remove("nohover");
            element.removeEventListener("mouseleave", handler);
        });
    }
}
