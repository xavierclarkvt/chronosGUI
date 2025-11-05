let api_key = "";
/**
 * Perform a health check on the api
 * @returns {Promise<Object>} The health check response data
 * @throws {Error} If the health check fails
 */
async function healthCheck() {
  const response = await fetch(
    `https://ssuowapy4e.execute-api.us-east-1.amazonaws.com/prod/api/health`,
    {
      headers: {
        "x-api-key": api_key,
      },
    }
  );
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }
  return await response.json();
}

async function getConfiguration(configUuid) {
  const queryParam =
    configUuid !== "root"
      ? `?parentUuid=${encodeURIComponent(configUuid)}`
      : "";
  const response = await fetch(
    `https://ssuowapy4e.execute-api.us-east-1.amazonaws.com/prod/api/configs/children${queryParam}`,
    {
      headers: {
        "x-api-key": api_key,
      },
    }
  );
  if (!response.ok) {
    throw new Error(`Error fetching configuration: ${response.statusText}`);
  }
  return await response.json();
}

async function getPartInfo(partUuid) {
  const response = await fetch(
    `https://ssuowapy4e.execute-api.us-east-1.amazonaws.com/prod/api/parts/${partUuid}`,
    {
      headers: {
        "x-api-key": api_key,
      },
    }
  );
  if (!response.ok) {
    throw new Error(`Error fetching part info: ${response.statusText}`);
  }
  return await response.json();
}

async function getAllowedPartStatuses(partUuid) {
  const response = await fetch(
    `https://ssuowapy4e.execute-api.us-east-1.amazonaws.com/prod/api/parts/${partUuid}/allowable-statuses`,
    {
      headers: {
        "x-api-key": api_key,
      },
    }
  );
  if (!response.ok) {
    throw new Error(
      `Error fetching allowed part statuses: ${response.statusText}`
    );
  }
  return await response.json();
}

async function updatePartInfo(partUuid) {
  // get updated data from input fields
  const unitInput = document.getElementById(`unit-input-${partUuid}`);
  const statusInput = document.getElementById(`status-input-${partUuid}`);
  const updatedData = {};
  if (unitInput) {
    updatedData.unit = unitInput.value;
  }
  if (statusInput) {
    updatedData.status = statusInput.value;
  }

  const response = await fetch(
    `https://ssuowapy4e.execute-api.us-east-1.amazonaws.com/prod/api/parts/${partUuid}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": api_key,
      },
      body: JSON.stringify(updatedData),
    }
  );
  if (!response.ok) {
    throw new Error(`Error updating part info: ${response.statusText}`);
  }
  return await response.json();
}

async function listChildrenConfigs(configUuid) {
  getConfiguration(configUuid)
    .then(async (data) => {
      if (data.length === 0) {
        console.error(`No child configurations found for ${configUuid}`);
        return;
      }

      // sort by serial number
      data.sort((a, b) => {
        const partCompare = String(a.partUuid).localeCompare(
          String(b.partUuid)
        );
        if (partCompare !== 0) return partCompare;
        // names are equal, sort by serial number
        return String(a.endUnitSerialNo || "").localeCompare(
          String(b.endUnitSerialNo || "")
        );
      });

      const output = document.getElementById(configUuid);
      const header = document.createElement("strong");
      header.innerText =
        configUuid === "root"
          ? "Root Configurations:"
          : "Child Configurations:";
      output.appendChild(header);

      // need to do this sequentially to ensure order
      for (const config of data) {
        // get part info so that we can display the part name
        try {
          const partInfo = await getPartInfo(config.partUuid);

          const partElement = document.createElement("div");
          partElement.innerHTML =
            `<button class="config-selector" id="button-${config.uuid}" ` +
            `onClick="expandConfig('${config.uuid}', '${encodeURIComponent(
              JSON.stringify(partInfo)
            )}')">` +
            `${partInfo.name} ${
              config?.endUnitSerialNo ? `(SN: ${config.endUnitSerialNo})` : ""
            }` +
            `</button>`;
          output.appendChild(partElement);
        } catch (error) {
          console.error("Error fetching part info:", error);
        }
      }
    })
    .catch((error) => {
      console.error("Configuration fetch error:", error);
    });
}

async function editUnitInfo(partUuid) {
  // update the element with partUuid to have an input box to edit the unit info
  const unitElem = document.getElementById(`unit-${partUuid}`);
  if (unitElem) {
    const currentUnit = unitElem.innerText
      .split(":")[1]
      .replace(/edit$/, "")
      .trim();

    unitElem.innerHTML = `<b>Unit:</b> <input type="text" id="unit-input-${partUuid}" value="${currentUnit}">`;

    // create submit button
    const checkButton = document.createElement("button");
    checkButton.textContent = "✔";
    checkButton.onclick = async () => {
      const res = await updatePartInfo(partUuid);
      const editButton = document.createElement("button");
      editButton.textContent = "edit";
      editButton.onclick = () => editUnitInfo(partUuid);
      unitElem.innerHTML = "<b>Unit:</b> " + (res.unit || "") + " ";
      unitElem.appendChild(editButton);
    };

    // create cancel button
    const cancelButton = document.createElement("button");
    cancelButton.innerHTML = "<strong>x</strong>";
    cancelButton.onclick = () => {
      const editButton = document.createElement("button");
      editButton.textContent = "edit";
      editButton.onclick = () => editUnitInfo(partUuid);
      unitElem.innerHTML = `<b>Unit:</b> ${currentUnit} `;
      unitElem.appendChild(editButton);
    };

    unitElem.appendChild(checkButton);
    unitElem.appendChild(cancelButton);
  } else {
    console.error(`Element with id unit-${partUuid} not found`);
  }
}

async function editStatusInfo(partUuid) {
  // update the element with partUuid to have an select box to edit the status info
  const statusElem = document.getElementById(`status-${partUuid}`);
  if (statusElem) {
    const currentStatus = statusElem.innerText
      .split(":")[1]
      .replace(/edit$/, "")
      .trim();

    const allowedStatuses = await getAllowedPartStatuses(partUuid).then(
      (data) => data.allowableStatuses || []
    );

    statusElem.innerHTML = `<b>Status:</b> <select id="status-input-${partUuid}">
            ${allowedStatuses
              .map(
                (status) =>
                  `<option value="${status}"${
                    status === currentStatus ? " selected" : ""
                  }>${status}</option>`
              )
              .join("")}
            </select>`;

    // create submit button
    const checkButton = document.createElement("button");
    checkButton.textContent = "✔";
    checkButton.onclick = async () => {
      const res = await updatePartInfo(partUuid);
      const editButton = document.createElement("button");
      editButton.textContent = "edit";
      editButton.onclick = () => editStatusInfo(partUuid);
      statusElem.innerHTML = "<b>Status:</b> " + (res.status || "") + " ";
      statusElem.appendChild(editButton);
    };

    // create cancel button
    const cancelButton = document.createElement("button");
    cancelButton.innerHTML = "<strong>x</strong>";
    cancelButton.onclick = () => {
      const editButton = document.createElement("button");
      editButton.textContent = "edit";
      editButton.onclick = () => editStatusInfo(partUuid);
      statusElem.innerHTML = `<b>Status:</b> ${currentStatus} `;
      statusElem.appendChild(editButton);
    };

    statusElem.appendChild(checkButton);
    statusElem.appendChild(cancelButton);
  } else {
    console.error(`Element with id status-${partUuid} not found`);
  }
}

// partinfo is JSON
async function expandConfig(configUuid, partInfo) {
  partInfo = JSON.parse(decodeURIComponent(partInfo));
  try {
    // display part info in a div beneath the button
    const buttonElem = document.getElementById("button-" + configUuid);
    if (buttonElem) {
      // remove existing part info if present
      const existingInfo = document.getElementById(`part-info-${configUuid}`);
      if (existingInfo) {
        existingInfo.remove();
      } else {
        const infoDiv = document.createElement("div");
        infoDiv.id = `part-info-${configUuid}`;
        infoDiv.style.marginLeft = "20px";
        infoDiv.innerHTML = `
                <strong>Part Info:</strong>
                <ul>
                <li><b>ID:</b> ${partInfo.uuid || ""}</li>
                <li><b>Name:</b> ${partInfo.name || ""}</li>
                <li id="unit-${partInfo.uuid}"><b>Unit:</b> ${
          partInfo.unit || ""
        } <button onClick="editUnitInfo('${partInfo.uuid}')">edit</button></li>
                <li id="status-${partInfo.uuid}"><b>Status:</b> ${
          partInfo.status || ""
        } <button onClick="editStatusInfo('${
          partInfo.uuid
        }')">edit</button></li>
                ${
                  partInfo?.version
                    ? `<li><b>Version:</b> ${partInfo.version || ""}</li>`
                    : ""
                }
                </ul>
                <div id="${configUuid}"></div>
              `;

        listChildrenConfigs(configUuid);

        buttonElem.parentNode.appendChild(infoDiv);
      }
    }
  } catch (error) {
    console.error("Error fetching part info:", error);
  }
}

/**
 * handle API key submission
 */
async function submitAPIKey() {
  const inputKey = document.getElementById("api-key-input").value;
  if (inputKey && inputKey.trim() !== "") {
    api_key = inputKey.trim();
    await healthCheck()
      .then((data) => {
        // hide the api key input div
        document.getElementById("api-key").style.display = "none";
        // start loading the configurations
        listChildrenConfigs("root"); // list configs at root
      })
      .catch((error) => {
        alert("API key is invalid or there was an error connecting to the API");
      });
  } else {
    alert("Please enter a valid API key.");
  }
}

// set event listener for api key submit button
document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("api-key-submit")
    .addEventListener("click", submitAPIKey);
  document
    .getElementById("api-key-input")
    .addEventListener("keyup", function (event) {
      if (event.key === "Enter") {
        submitAPIKey();
      }
    });
});
