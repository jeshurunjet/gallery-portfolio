import { useEffect, useState } from "react";

const phrases = [
  "Full-stack developer with a designer's eye.",
  "Developer by craft. Designer by instinct.",
  "Bridging creativity and technology.",
  "Turning ideas into digital experiences.",
];

function TypingText() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          const nextText = currentPhrase.slice(0, text.length + 1);
          setText(nextText);

          if (nextText === currentPhrase) {
            setTimeout(() => setIsDeleting(true), 5000);
          }
        } else {
          const nextText = currentPhrase.slice(0, text.length - 1);
          setText(nextText);

          if (nextText === "") {
            setIsDeleting(false);
            setPhraseIndex((prev) => (prev + 1) % phrases.length);
          }
        }
      },
      isDeleting ? 30 : 90
    );

    return () => clearTimeout(timeout);
  }, [text, isDeleting, phraseIndex]);

  return (
    <span className="typing-text">
      {text}
      <span className="typing-cursor">|</span>
    </span>
  );
}

export default TypingText;
