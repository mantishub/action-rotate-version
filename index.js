const https = require('https');

/**
 * Env variables from GitHub workflow input
 */
const params = {
    url: process.env['INPUT_URL'] || "",
    apiKey: process.env['INPUT_API-KEY'] || "",
    project: process.env['INPUT_PROJECT'] || "",
    releaseName: process.env['INPUT_RELEASE-NAME'] || "",
    placeholderName: process.env['INPUT_PLACEHOLDER-NAME'] || "",
    nextReleaseInDays: process.env['INPUT_NEXT-RELEASE-IN-DAYS'] || ""
};

/**
 * Main function
 *
 */
async function run() {
    if (!params.url || !params.apiKey || !params.project || !params.releaseName || !params.project
        || !params.placeholderName || !params.placeholderName) {
        throw new Error("Project name, url and api-key inputs are required.");
    }
    const newVersion = await rotateVersion(params);
    console.log(`::set-output name=version-id::${newVersion.version.id}`);
    return newVersion.id;
}

/**
 * Rotate a version in MantisHub
 *
 * @param data
 */
async function rotateVersion(data) {
    try {
        const body = {
            placeholderName: data.placeholderName,
            releaseName: data.releaseName,
            nextReleaseInDays: data.nextReleaseInDays
        };
        // validate request body for create version
        const validated = validateInput(body);
        if (!validated) {
            console.error('Validation errors')
            process.exit(1)
        }
        // fetch project id from project name
        const projectID = await getProjectID(String(data.project));
        // get version ID from name e.g vNext
        const versionID = await getVersionID(projectID, data.placeholderName);
        if (versionID !== null) {
            // update current release version (vNext) to tag name
            const updateVersionBody = {
                name: body.releaseName,
                released: true,
                timestamp: getDate(),
            };
            await updateVersion(projectID, versionID, updateVersionBody);
        }
        // Create a new version with placeholder name
        const createVersionBody = {
            name: body.placeholderName,
            released: false,
            obsolete: false,
            timestamp: getDate(parseInt(body.nextReleaseInDays, 10))
        };
        return await createVersion(projectID, createVersionBody);
    } catch (error) {
        console.error("Failed to rotate version:", error.message);
        if (error.response) {
            console.error("Error response data:", error.response.data);
        }
        process.exit(1);
    }
}

/**
 * HTTP Requests
 *
 * @param url
 * @param method 'GET', 'PATCH', 'POST'
 * @param body
 */
async function httpRequest(url, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        let options = {
            method: method,
            headers: {
                'Authorization': params.apiKey,
                'Content-Type': 'application/json',
            }
        }
        if (body !== null) {
            options.body = JSON.stringify(body)
        }
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(data); // Resolve with the response data
                } else {
                    console.log(`Request failed with status code ${res.statusCode}: ${data}`)
                    reject(new Error(`Request failed with status code ${res.statusCode}: ${data}`));

                }
            });
        });
        if (body !== null) {
            req.write(JSON.stringify(body));
        }
        req.on('error', (e) => {
            reject(e); // Reject the promise with the error
        });
        req.end(); // End the request
    });
}


/**
 * Fetch projects from MantisHub
 */
async function fetchProjects() {
    const endpoint = `${params.url}/api/rest/projects`;
    console.log('Making request : ' + endpoint)
    const response = await httpRequest(endpoint); // Await the asynchronous call
    console.log(JSON.parse(response));
    return JSON.parse(response);
}

/**
 * Fetch Versions of a project
 */
async function fetchVersions(projectID) {
    const endpoint = `${params.url}/api/rest/projects/${projectID}/versions`;
    console.log('Making request to:' + endpoint)
    const response = await httpRequest(endpoint); // Await the asynchronous call
    console.log(JSON.parse(response));
    return JSON.parse(response);
}

/**
 * Fetch projects and finds the input project name and returns the project id
 * @param projectName
 */
async function getProjectID(projectName) {
    try {
        const response = await fetchProjects();
        // Check if response.projects is empty
        if (!(Object.prototype.hasOwnProperty.call(response, "projects") && response.projects.length > 0)) {
            console.log(`No results found`);
            process.exit(1);
        }
        // use `find` to search for the project by name
        const project = response.projects.find(function (p) {
            return p.name === projectName;
        });
        if (project) {
            return project.id; // Return the project ID if found
        } else {
            console.error(`Project with name "${projectName}" not found.`);
            process.exit(1);
        }
    } catch (error) {
        console.error("Error fetching projects:", error.message);
        process.exit(1);
    }
}

/**
 * Fetch version and finds the input version name and returns the version id
 * @param projectID
 * @param versionName
 */
async function getVersionID(projectID, versionName) {
    try {
        const response = await fetchVersions(projectID);
        // Check if response.version is empty
        if (!(Object.prototype.hasOwnProperty.call(response, "versions") && response.versions.length > 0)) {
            console.log(`No results found`);
            process.exit(1);
        }
        // use `find` to search for the project by name
        const version = response.versions.find(function (p) {
            return p.name === versionName;
        });
        return version ? version.id : null;
    } catch (error) {
        console.error("Error fetching version:", error.message);
        process.exit(1);
    }
}

/**
 * Updates the existing version
 * @param projectID
 * @param versionID
 * @param body
 */
async function updateVersion(projectID, versionID, body) {
    const endpoint = `${params.url}/api/rest/projects/${projectID}/versions/${versionID}`;
    console.log('Making request Patch request to update the version :' + endpoint)
    console.log(body)
    const response = await httpRequest(endpoint, 'PATCH', body);
    const responseBody = JSON.parse(response);
    console.log(responseBody);
    return responseBody;
}

/**
 * Creates a new version
 * @param projectID
 * @param body
 */
async function createVersion(projectID, body) {
    const endpoint = `${params.url}/api/rest/projects/${projectID}/versions`;
    console.log('Making POST request to create new version :' + endpoint)
    const response = await httpRequest(endpoint, 'POST', body);
    const responseBody = JSON.parse(response);
    console.log(responseBody);
    return responseBody;
}

/**
 * ===== Utility functions =======
 */
function getDate(days = 0) {
    const date = new Date(); // Current date
    date.setDate(date.getDate() + days); // Add 'days' to the current date
    return date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
}

function isNumber(value) {
    return !isNaN(Number(value));
}

function validateInput(data) {

    if (typeof data !== 'object' || data === null) {
        throw new Error('Invalid input: must be an object');
    }

    const {placeholderName, releaseName, nextReleaseInDays} = data;

    if (typeof placeholderName !== 'string' || placeholderName.trim() === '') {
        throw new Error('Invalid placeholderName: must be a non-empty string');
    }

    if (typeof releaseName !== 'string' || releaseName.trim() === '') {
        throw new Error('Invalid releaseName: must be a non-empty string');
    }

    if (!isNumber(nextReleaseInDays)) {
        throw new Error('Invalid nextReleaseInDays: must be a positive number');
    }

    return true;

}

run();
