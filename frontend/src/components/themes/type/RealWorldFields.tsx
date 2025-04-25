import React from "react";

interface Props {
  extraFields: any;
  setExtraFields: React.Dispatch<React.SetStateAction<any>>;
}

const RealWorldFields: React.FC<Props> = () => {
  return <div className="mt-6">REALWORLD 타입 전용 항목 (현재 없음)</div>;
};

export default RealWorldFields;