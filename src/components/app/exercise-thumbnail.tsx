import { Dumbbell } from "lucide-react";
import { useState } from "react";

export function ExerciseThumbnail({ src }: { src?: string | null }) {
  const [failed, setFailed] = useState<string | null>(null);
  return (
    <span className="exercise-thumbnail" aria-hidden="true">
      {src && failed !== src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setFailed(src)}
        />
      ) : (
        <Dumbbell size={19} />
      )}
    </span>
  );
}
