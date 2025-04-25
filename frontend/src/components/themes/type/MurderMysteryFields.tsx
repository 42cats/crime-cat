import React from "react";

interface Props {
  extraFields: any;
  setExtraFields: React.Dispatch<React.SetStateAction<any>>;
}

const MurderMysteryFields: React.FC<Props> = () => {
  return <div className="mt-6">MURDERMYSTERY 타입 전용 항목 (현재 없음)</div>;
};

export default MurderMysteryFields;