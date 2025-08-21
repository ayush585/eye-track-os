// src/hooks/useCamera.ts
import { useEffect, useRef, useState } from "react";

export function useCamera() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let stream: MediaStream | null = null;
        (async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 60 } },
                    audio: false
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                    setReady(true);
                }
            } catch (e: any) {
                setError(e?.message || "Camera error");
            }
        })();
        return () => { stream?.getTracks().forEach(t => t.stop()); };
    }, []);

    return { videoRef, ready, error };
}
