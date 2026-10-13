import { Star } from "lucide-react";

export function StarRating({ rating = 4 }) {
  return (
    <div className="d-flex align-items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={13}
          strokeWidth={0}
          aria-hidden="true"
          fill={star <= rating ? "#F5820D" : "#E5E7EB"}
        />
      ))}
    </div>
  );
}
