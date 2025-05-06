import React from "react";
import Image from "next/image";

const AVATARS = [
  "/assets/images/avatar-1.svg",
  "/assets/images/avatar-2.svg",
  "/assets/images/avatar-3.svg",
  "/assets/images/avatar-4.svg",
  "/assets/images/avatar-5.svg",
];

interface AvatarSelectorProps {
  selectedAvatar: string;
  onSelect: (avatar: string) => void;
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  selectedAvatar,
  onSelect,
}) => {
  return (
    <div className="avatar-selector">
      <h3>Choose your avatar</h3>
      <div className="avatar-grid">
        {AVATARS.map((avatar, index) => (
          <div
            key={index}
            className={`avatar-option ${
              selectedAvatar === avatar ? "selected" : ""
            }`}
            onClick={() => onSelect(avatar)}
          >
            <Image
              src={avatar}
              alt={`Avatar option ${index + 1}`}
              width={64}
              height={64}
            />
          </div>
        ))}
      </div>
      <style jsx>{`
        .avatar-grid {
          display: flex;
          gap: 1rem;
        }
        .avatar-option {
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 50%;
          border: 2px solid transparent;
        }
        .avatar-option.selected {
          border-color: #4299e1;
        }
      `}</style>
    </div>
  );
};

export default AvatarSelector;
