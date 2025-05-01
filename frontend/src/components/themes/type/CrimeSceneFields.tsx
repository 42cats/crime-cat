import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  extraFields: any;
  setExtraFields: React.Dispatch<React.SetStateAction<any>>;
  onOpenTeamModal: () => void;
  onOpenGuildModal: () => void;
}

const CrimeSceneFields: React.FC<Props> = ({ extraFields, setExtraFields, onOpenTeamModal, onOpenGuildModal }) => {
  const { user } = useAuth();
  const [characterInput, setCharacterInput] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  const mode = extraFields?.makerMode || "team";

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

  const handleModeChange = (val: "personal" | "team") => {
    if (val === "personal") {
      setExtraFields((prev: any) => ({
        ...prev,
        makerMode: "personal",
        makerTeamsId: "",
        makerTeamsName: "",
      }));
    } else {
      setExtraFields((prev: any) => ({
        ...prev,
        makerMode: "team",
        makerTeamsId: "",
        makerTeamsName: "",
      }));
    }
  };

  return (
    <div className="space-y-6 mt-6">
      {/* 개인 / 팀 선택 */}
      <div className="space-y-2">
        <Label className="font-bold block">개인 / 팀 선택 *</Label>
        <RadioGroup
          value={mode}
          onValueChange={(val) => handleModeChange(val as "personal" | "team")}
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="personal" id="personal" />
            <Label htmlFor="personal" className="cursor-pointer">개인</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="team" id="team" />
            <Label htmlFor="team" className="cursor-pointer">팀</Label>
          </div>
        </RadioGroup>
      </div>

      {/* 팀 선택 */}
      {mode === "team" && (
        <div>
          <Button variant="outline" onClick={onOpenTeamModal}>
            {"팀 선택"}
          </Button>
          <Input
            className="mt-2"
            readOnly
            value={extraFields?.makerTeamsName || ""}
            placeholder="선택된 팀이 없습니다"
          />
        </div>
      )}

      {/* 길드 선택 */}
      <div>
        <Label className="font-bold mb-1 block">길드 선택</Label>
        <Button variant="outline" onClick={onOpenGuildModal}>
          {"길드 선택"}
        </Button>
        <Input
          className="mt-2"
          readOnly
          value={extraFields?.guildName || ""}
          placeholder="선택된 길드가 없습니다"
        />
      </div>

      {/* 등장 캐릭터 */}
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