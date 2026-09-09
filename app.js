const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output-canvas');
const canvasCtx = canvasElement.getContext('2d');
const feedbackText = document.getElementById('feedback-text');
const startBtn = document.getElementById('start-btn');
const poseSelect = document.getElementById('pose-select');

// Helper to calculate geometry angles between joints
function calculateAngle(a, b, c) {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
}

function onResults(results) {
    // Clear canvas frame
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    if (!results.poseLandmarks) {
        feedbackText.innerText = "No person detected. Step into frame.";
        feedbackText.className = "status-waiting";
        return;
    }

    // Draw the landmark skeleton overlay
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#8A2BE2', lineWidth: 4 });
    drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#4CD964', lineWidth: 2, radius: 4 });

    // Extract specific landmarks needed for checking poses
    const landmarks = results.poseLandmarks;
    const leftShoulder = landmarks[11];
    const leftElbow = landmarks[13];
    const leftWrist = landmarks[15];
    const leftHip = landmarks[23];
    const leftKnee = landmarks[25];
    const leftAnkle = landmarks[27];

    const currentPose = poseSelect.value;
    evaluatePose(currentPose, leftShoulder, leftElbow, leftWrist, leftHip, leftKnee, leftAnkle);
}

// Simple rules engine evaluating geometric rules per target yoga position
function evaluatePose(pose, shoulder, elbow, wrist, hip, knee, ankle) {
    if (pose === 'plank') {
        const spineLegAngle = calculateAngle(shoulder, hip, knee);
        // Core structural check: Plank demands a straight straight spine line (~170-180 deg)
        if (spineLegAngle > 165) {
            feedbackText.innerText = "Perfect Plank! Keep your core tight.";
            feedbackText.className = "status-correct";
        } else {
            feedbackText.innerText = "Fix form: Don't let your hips sag or push your butt too high.";
            feedbackText.className = "status-incorrect";
        }
    } 
    else if (pose === 'warrior2') {
        const kneeAngle = calculateAngle(hip, knee, ankle);
        // Knee flex check for lead leg running perpendicular to floor
        if (kneeAngle < 120 && kneeAngle > 80) {
            feedbackText.innerText = "Great Warrior II stance! Hold and breathe.";
            feedbackText.className = "status-correct";
        } else {
            feedbackText.innerText = "Fix form: Bend your front knee closer to a 90-degree angle.";
            feedbackText.className = "status-incorrect";
        }
    } 
    else if (pose === 'tree') {
        const standingLegAngle = calculateAngle(hip, knee, ankle);
        // Checks if standing frame remains perfectly vertical 
        if (standingLegAngle > 170) {
            feedbackText.innerText = "Excellent Tree Pose balance!";
            feedbackText.className = "status-correct";
        } else {
            feedbackText.innerText = "Fix form: Straighten your standing supporting leg.";
            feedbackText.className = "status-incorrect";
        }
    }
}

// Initializing MediaPipe Model Configurations
const pose = new Pose({
    locateFile: (file) => `https://jsdelivr.net{file}`
});

pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

pose.onResults(onResults);

// Setup stream capture mechanics
pose.initialize().then(() => {
    feedbackText.innerText = "AI Model Ready. Start your camera!";
    feedbackText.className = "status-waiting";
    startBtn.disabled = false;
});

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await pose.send({ image: videoElement });
    },
    width: 640,
    height: 480
});

startBtn.addEventListener('click', () => {
    camera.start();
    feedbackText.innerText = "Camera Active. Step back to view entire body.";
    startBtn.style.display = "none";
});

// Set hard sizes dynamically matching stylesheet
canvasElement.width = 640;
canvasElement.height = 480;
