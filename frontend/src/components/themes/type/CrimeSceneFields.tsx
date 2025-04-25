import React, { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Props {
  extraFields: any;
  setExtraFields: React.Dispatch<React.SetStateAction<any>>;
  onOpenTeamModal: () => void;
  onOpenGuildModal: () => void;
}

const CrimeSceneFields: React.FC<Props> = ({ extraFields, setExtraFields, onOpenTeamModal, onOpenGuildModal }) => {
  const [characterInput, setCharacterInput] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  const addCharactersFromInput = () => {
    const parts = characterInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !(extraFields.extra?.characters || []).includes(t));

    if (parts.length > 0) {
      setExtraFields((prev: any) => ({
        ...prev,
        extra: {
          ...prev.extra,
          characters: [...(prev.extra?.characters || []), ...parts],
        },
      }));
      setCharacterInput("");
    }
  };

  return (
    <div className="space-y-4 mt-6">
      <div>
        <Label className="font-bold mb-1 block">팀 선택 *</Label>
        <Button variant="outline" onClick={onOpenTeamModal}>
          {extraFields?.makerTeamsId ? "다시 선택" : "팀 선택"}
        </Button>
        <Input
          className="mt-2"
          readOnly
          value={extraFields?.makerTeamsId || ""}
          placeholder="선택된 팀 ID가 없습니다"
        />
      </div>

      <div>
        <Label className="font-bold mb-1 block">길드 선택 *</Label>
        <Button variant="outline" onClick={onOpenGuildModal}>
          {extraFields?.guildSnowflake ? "다시 선택" : "길드 선택"}
        </Button>
        <Input
          className="mt-2"
          readOnly
          value={extraFields?.guildSnowflake || ""}
          placeholder="선택된 길드 ID가 없습니다"
        />
      </div>

      <div>
        <Label className="font-bold mb-1 block">등장 캐릭터</Label>
        <div className="flex gap-2 mt-1 mb-2 flex-wrap">
          {(extraFields?.extra?.characters || []).map((ch: string) => (
            <Badge
              key={ch}
              className="cursor-pointer"
              onClick={() =>
                setExtraFields((prev: any) => ({
                  ...prev,
                  extra: {
                    ...prev.extra,
                    characters: prev.extra.characters.filter((c: string) => c !== ch),
                  },
                }))
              }
            >
              {ch}
            </Badge>
          ))}
        </div>
        <Input
          value={characterInput}
          onChange={(e) => setCharacterInput(e.target.value)}
          onKeyDown={(e) => {
            if (!isComposing && (e.key === "Enter" || e.key === ",")) {
              e.preventDefault();
              addCharactersFromInput();
            }
          }}
          onKeyUp={(e) => {
            if (!isComposing && e.key === ",") {
              e.preventDefault();
              addCharactersFromInput();
            }
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="쉼표 또는 Enter로 구분"
        />
      </div>
    </div>
  );
};

export default CrimeSceneFields;
