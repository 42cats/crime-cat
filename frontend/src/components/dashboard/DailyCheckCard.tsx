import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  isComplete: boolean;
  onCheck: () => void;
  isLoading: boolean;
}

export const DailyCheckCard: React.FC<Props> = ({ isComplete, onCheck, isLoading }) => (
	<Card className="w-[17rem]">
    <CardHeader>
      <CardTitle>출석 체크</CardTitle>
      <CardDescription>오늘 출석을 기록하세요.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="attendance"
          className="h-4 w-4"
          checked={isComplete}
          readOnly
        />
        <label htmlFor="attendance" className="text-sm text-muted-foreground">
          {isComplete ? '출석 완료' : '아직 출석하지 않음'}
        </label>
      </div>
      {!isComplete && (
        <Button size="sm" onClick={onCheck} disabled={isLoading || isComplete}>
          {isLoading ? '체크 중...' : '출석 체크하기'}
        </Button>
      )}
    </CardContent>
  </Card>
);