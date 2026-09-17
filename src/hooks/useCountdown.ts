import { useState, useEffect } from "react";

export const useCountdown = (initialSeconds: number) => {
    const [timeLeft, setTimeLeft] = useState(initialSeconds);

    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    return { timeLeft, isFinished: timeLeft === 0 };
};