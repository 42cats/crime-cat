import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface Props {
  playCount?: number;
  averagePlayTime?: string;
}

export const PlayInfoCard: React.FC<Props> = ({ playCount, averagePlayTime }) => (
  <Card className="w-[17rem]">
    <CardHeader>
      <CardTitle>플레이 정보</CardTitle>
      <CardDescription>게임 관련 정보를 확인하세요.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">플레이 횟수</p>
        <p className="mt-1 text-base">{playCount ?? '-'}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">평균 플레이 시간</p>
        <p className="mt-1 text-base">{averagePlayTime ?? '-'}</p>
      </div>
    </CardContent>
  </Card>
);