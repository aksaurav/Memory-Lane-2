import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import axios from "axios";

const CameraView = () => {
  const videoRef = useRef();
  const [identity, setIdentity] = useState(null);
  const [transcript, setTranscript] = useState("");

  // Setup Speech Recognition
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
  }

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      startVideo();
    };
    loadModels();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error(err));
  };

  const handleSpeech = (id) => {
    if (!recognition) return;

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setTranscript(text);

      // Trigger Logic: "My name is..."
      if (text.toLowerCase().includes("my name is")) {
        const words = text.split(" ");
        const name = words[words.indexOf("is") + 1];
        if (name) updateBackend(id, text, name);
      }
    };

    // Update memory when user finishes a sentence
    recognition.onspeechend = () => {
      if (transcript.length > 5) {
        updateBackend(id, transcript);
      }
    };

    recognition.start();
  };

  const updateBackend = async (id, text, name = null) => {
    try {
      const res = await axios.put(
        "http://localhost:5000/api/identities/update-memory",
        {
          id,
          text,
          name,
        },
      );
      setIdentity(res.data);
    } catch (err) {
      console.error("Memory update failed", err);
    }
  };

  const handleVideoPlay = () => {
    setInterval(async () => {
      if (videoRef.current) {
        const detection = await faceapi
          .detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions(),
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          const response = await axios.post(
            "http://localhost:5000/api/identities/recognize",
            {
              descriptor: Array.from(detection.descriptor),
            },
          );

          const user = response.data.data;
          setIdentity(user);

          // Start listening if we haven't already for this session
          if (recognition && !identity) {
            handleSpeech(user._id);
          }
        }
      }
    }, 2000);
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        muted
        onPlay={handleVideoPlay}
        className="absolute inset-0 w-full h-full object-cover grayscale contrast-125"
      />

      {/* AI HUD Overlay */}
      <div className="z-10 absolute bottom-12 left-12 p-8 bg-black/40 backdrop-blur-xl rounded-2xl border border-cyan-500/30 text-white shadow-[0_0_20px_rgba(6,182,212,0.2)]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          <span className="text-xs uppercase tracking-widest text-cyan-400 font-bold">
            System Online
          </span>
        </div>

        <h2 className="text-3xl font-light tracking-tight">
          {identity?.name === "Unknown"
            ? "Identifying..."
            : `Subject: ${identity?.name}`}
        </h2>

        <div className="mt-4 space-y-2">
          <p className="text-gray-400 text-sm uppercase font-semibold">
            Last Recorded Memory:
          </p>
          <p className="text-cyan-100/80 italic font-serif">
            "{identity?.lastConversation || "Awaiting first interaction..."}"
          </p>
        </div>

        {transcript && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-[10px] text-gray-500 uppercase">
              Live Transcript
            </p>
            <p className="text-sm text-green-400 truncate w-64">{transcript}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraView;
