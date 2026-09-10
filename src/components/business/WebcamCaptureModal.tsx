"use client";

import React, { useState, useRef, useEffect } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Camera, RefreshCw, Upload, Check, AlertCircle } from "lucide-react";

interface WebcamCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (dataUrl: string) => void;
  memberName: string;
}

export const WebcamCaptureModal: React.FC<WebcamCaptureModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  memberName,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    setCameraError(null);
    setIsLoadingCamera(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Accès caméra non supporté par ce navigateur");
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 480 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn("Camera error:", err);
      setCameraError(
        "Impossible d'accéder à la caméra. Vérifiez les autorisations ou importez un fichier."
      );
    } finally {
      setIsLoadingCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  // Keep videoRef updated when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const size = Math.min(video.videoWidth || 320, video.videoHeight || 320);
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Crop center square
    const startX = ((video.videoWidth || 320) - size) / 2;
    const startY = ((video.videoHeight || 320) - size) / 2;
    ctx.drawImage(video, startX, startY, size, size, 0, 0, 300, 300);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 300, 300);
          setCapturedPhoto(canvas.toDataURL("image/jpeg", 0.82));
          stopCamera();
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (capturedPhoto) {
      onSuccess(capturedPhoto);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Photo de l'adhérent"
      description={`Enregistrer la photo d'identité de ${memberName}`}
      size="sm"
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Upload className="w-4 h-4" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Importer fichier
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Annuler
            </Button>
            {capturedPhoto ? (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Check className="w-4 h-4" />}
                onClick={handleSave}
              >
                Valider la photo
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Camera className="w-4 h-4" />}
                onClick={handleCapture}
                disabled={!stream}
              >
                Prendre la photo
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-3">
        {capturedPhoto ? (
          /* Captured Preview */
          <div className="flex flex-col items-center">
            <div className="w-56 h-56 rounded-full overflow-hidden border-4 border-[#2563EB] shadow-xl relative bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedPhoto}
                alt="Aperçu"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => {
                setCapturedPhoto(null);
                startCamera();
              }}
              className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-[#2563EB] hover:underline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reprendre une autre photo</span>
            </button>
          </div>
        ) : (
          /* Live Camera Stream */
          <div className="flex flex-col items-center">
            <div className="w-56 h-56 rounded-full overflow-hidden border-4 border-[#CBD5E1] shadow-md relative bg-[#0F172A] flex items-center justify-center">
              {isLoadingCamera && (
                <div className="text-white text-[12px]">Démarrage caméra...</div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
            </div>

            {cameraError ? (
              <div className="mt-3 p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] text-[12px] text-[#DC2626] flex items-center gap-2 max-w-sm text-center">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{cameraError}</span>
              </div>
            ) : (
              <p className="text-[12px] text-[#64748B] mt-2">
                Cadrez le visage au centre et cliquez sur « Prendre la photo ».
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
