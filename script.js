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

/**
 * Fetch configuration data
 * @param {String} configUuid The configuration UUID
 * @returns {Promise<Object>} The configuration data as json
 * @throws {Error} If the fetch fails
 */
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

/**
 * Fetch part information
 * @param {String} partUuid The part UUID
 * @returns {Promise<Object>} The part information as json
 * @throws {Error} If the fetch fails
 */
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

/**
 * Fetch allowed part statuses
 * @param {String} partUuid The part UUID
 * @returns {Promise<Object>} The allowed part statuses as json ({ allowableStatuses: [] })
 * @throws {Error} If the fetch fails
 */
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

/**
 * Update part information, getting the values from input fields
 * @param {String} partUuid the part UUID, used to find the input fields
 * @returns part info JSON after update
 * @throws {Error} If the update fails
 */
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

/**
 * List child configurations for a given configuration UUID
 * Creates buttons for each child configuration to expand further
 * @param {String} configUuid the configuration UUID
 */
async function listChildrenConfigs(configUuid) {
  getConfiguration(configUuid)
    .then(async (data) => {
      if (data.length === 0) {
        // no child configurations
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
          // create the button element
          const button = document.createElement("button");
          button.className = "config-selector";
          button.id = `button-${config.uuid}`;
          button.textContent = `${partInfo.name} ${
            config?.endUnitSerialNo ? `(SN: ${config.endUnitSerialNo})` : ""
          }`;

          // attach the click handler as a function
          button.addEventListener("click", () => {
            expandConfig(
              config.uuid,
              config.partUuid
            );
          });

          partElement.appendChild(button);
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

/**
 * Edit the unit info for a part
 * Changes the display to an input box with submit and cancel buttons
 * @param {String} partUuid the part UUID
 */
async function editUnitInfo(partUuid) {
  // update the element with partUuid to have an input box to edit the unit info
  const unitElem = document.getElementById(`unit-${partUuid}`);
  if (unitElem) {
    const currentUnit = unitElem.innerText
      .split(":")[1]
      .replace(/edit$/, "") // need to remove the edit button text from the input
      .trim();

    unitElem.innerHTML = `<b>Unit:</b> <input type="text" id="unit-input-${partUuid}" value="${currentUnit}">`;

    // create submit button
    const checkButton = document.createElement("button");
    checkButton.textContent = "✔";
    checkButton.onclick = async () => {
      try {
        const res = await updatePartInfo(partUuid);
        const editButton = document.createElement("button");
        editButton.textContent = "edit";
        editButton.onclick = () => editUnitInfo(partUuid);
        unitElem.innerHTML = "<b>Unit:</b> " + (res.unit || "") + " ";
        unitElem.appendChild(editButton);
      } catch (error) {
        // tested by disconnecting network and forcing an error
        alert("Error updating status: " + (error.message || error));
        const editButton = document.createElement("button");
        editButton.textContent = "edit";
        editButton.onclick = () => editUnitInfo(partUuid);
        unitElem.innerHTML = `<b>Unit:</b> ${currentUnit} `;
        unitElem.appendChild(editButton);
      }
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

/**
 * Edit the status info for a part
 * Changes the display to an select box with submit and cancel buttons
 * Gets the allowed statuses from the API
 * @param {String} partUuid the part UUID
 */
async function editStatusInfo(partUuid) {
  // update the element with partUuid to have a select box to edit the status info
  const statusElem = document.getElementById(`status-${partUuid}`);
  if (statusElem) {
    const currentStatus = statusElem.innerText
      .split(":")[1]
      .replace(/edit$/, "") // need to remove the edit button text from the input
      .trim();

    const allowedStatuses = await getAllowedPartStatuses(partUuid).then(
      (data) => data.allowableStatuses || []
    );

    // create the select element
    const select = document.createElement("select");
    select.id = `status-input-${partUuid}`;
    allowedStatuses.forEach((status) => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status;
      if (status === currentStatus) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    // clear and update the statusElem
    statusElem.innerHTML = "<b>Status:</b> ";
    statusElem.appendChild(select);

    // create submit button
    const checkButton = document.createElement("button");
    checkButton.textContent = "✔";
    checkButton.onclick = async () => {
      try {
        const res = await updatePartInfo(partUuid);
        const editButton = document.createElement("button");
        editButton.textContent = "edit";
        editButton.onclick = () => editStatusInfo(partUuid);
        statusElem.innerHTML = "<b>Status:</b> " + (res.status || "") + " ";
        statusElem.appendChild(editButton);
      } catch (error) {
        // tested by disconnecting network and forcing an error
        alert("Error updating status: " + (error.message || error));
        const editButton = document.createElement("button");
        editButton.textContent = "edit";
        editButton.onclick = () => editStatusInfo(partUuid);
        statusElem.innerHTML = `<b>Status:</b> ${currentStatus} `;
        statusElem.appendChild(editButton);
      }
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
/**
 * Expand a configuration to show its part info and child configurations
 * @param {String} configUuid the configuration UUID
 * @param {String} partUuid the part UUID
 */
async function expandConfig(configUuid, partUuid) {
  // fetch part info again to avoid stale data
  const partInfo = await getPartInfo(partUuid);
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
        infoDiv.className = "part-info";
        infoDiv.innerHTML = `
          <strong>Part Info:</strong>
          <ul>
          <li><b>ID:</b> ${partInfo.uuid || ""}</li>
          <li><b>Name:</b> ${partInfo.name || ""}</li>
          <li id="unit-${partInfo.uuid}"><b>Unit:</b> ${
          partInfo.unit || ""
        } </li>
          <li id="status-${partInfo.uuid}"><b>Status:</b> ${
          partInfo.status || ""
        } </li>
          ${
            partInfo?.version
              ? `<li><b>Version:</b> ${partInfo.version || ""}</li>`
              : "" // version is optional
          }
          </ul>
          <div id="${configUuid}"></div>`;

        // add edit button for unit
        const unitElem = infoDiv.querySelector(`#unit-${partInfo.uuid}`);
        if (unitElem) {
          const editUnitButton = document.createElement("button");
          editUnitButton.textContent = "edit";
          editUnitButton.onclick = () => editUnitInfo(partInfo.uuid);
          unitElem.appendChild(editUnitButton);
        }

        // add edit button for status
        const statusElem = infoDiv.querySelector(`#status-${partInfo.uuid}`);
        if (statusElem) {
          const editStatusButton = document.createElement("button");
          editStatusButton.textContent = "edit";
          editStatusButton.onclick = () => editStatusInfo(partInfo.uuid);
          statusElem.appendChild(editStatusButton);
        }

        listChildrenConfigs(configUuid);

        // append the infoDiv after the "open config" button
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
