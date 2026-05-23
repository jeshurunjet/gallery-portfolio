import { useEffect, useState, useMemo, useRef } from "react";

const fallbackPhrases = [
  "Full-stack developer with a designer's eye.",
  "Developer by craft. Designer by instinct.",
  "Bridging creativity and technology.",
  "Turning ideas into digital experiences.",
];

type TypingTextProps = {
  phrases?: string[];
};

function TypingText({ phrases }: TypingTextProps) {
  const [displayText, setDisplayText] = useState("");
  const animationStateRef = useRef({
    phraseIndex: 0,
    text: "",
    isDeleting: false,
  });

  const activePhrases = useMemo(
    () =>
      phrases?.filter(Boolean).length
        ? phrases.filter(Boolean)
        : fallbackPhrases,
    [phrases]
  );

  useEffect(() => {
    const animate = () => {
      const state = animationStateRef.current;
      const currentPhrase = activePhrases[state.phraseIndex];

      if (!state.isDeleting) {
        state.text = currentPhrase.slice(0, state.text.length + 1);
        setDisplayText(state.text);

        if (state.text === currentPhrase) {
          setTimeout(() => {
            state.isDeleting = true;
            animate();
          }, 5000);
          return;
        }
      } else {
        state.text = currentPhrase.slice(0, state.text.length - 1);
        setDisplayText(state.text);

        if (state.text === "") {
          state.isDeleting = false;
          state.phraseIndex = (state.phraseIndex + 1) % activePhrases.length;
        }
      }

      setTimeout(animate, state.isDeleting ? 30 : 90);
    };

    animate();
  }, [activePhrases]);

  useEffect(() => {
    animationStateRef.current = {
      phraseIndex: 0,
      text: "",
      isDeleting: false,
    };
    setDisplayText("");
  }, [activePhrases]);

  return (
    <span className="typing-text">
      {displayText}
      <span className="typing-cursor">|</span>
    </span>
  );
}

export default TypingText;
