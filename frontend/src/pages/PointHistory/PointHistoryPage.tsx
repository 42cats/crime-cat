import React, { useState, useEffect } from 'react';
import { pointHistoryApi } from '@/lib/api';
import { UTCToKST } from '@/lib/dateFormat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChevronLeft, ChevronRight, RefreshCw, Coins, TrendingUp, TrendingDown, Gift, RotateCcw, ArrowUp, ArrowDown } from 'lucide-react';
import { PointHistory, PointSummary, PageResponse, SortType, SortOption } from '@/types/pointHistory';

const transactionTypeLabels = {
  CHARGE: '충전',
  USE: '사용',
  GIFT: '선물',
  RECEIVE: '받음',
  REFUND: '환불',
  EXPIRE: '만료',
  COUPON: '쿠폰',
  DAILY: '출석'
};

const sortOptions: SortOption[] = [
  { value: 'LATEST', label: '최신순', description: '최근 사용 내역부터' },
  { value: 'OLDEST', label: '오래된순', description: '과거 사용 내역부터' },
  { value: 'AMOUNT_DESC', label: '금액 내림차순', description: '큰 금액부터' },
  { value: 'AMOUNT_ASC', label: '금액 오름차순', description: '작은 금액부터' },
  { value: 'BALANCE_DESC', label: '잔액 내림차순', description: '높은 잔액부터' },
  { value: 'BALANCE_ASC', label: '잔액 오름차순', description: '낮은 잔액부터' },
];

const getTransactionIcon = (type: PointHistory['type']) => {
  switch (type) {
    case 'CHARGE':
    case 'DAILY':
    case 'COUPON':
    case 'RECEIVE':
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    case 'USE':
    case 'EXPIRE':
    case 'GIFT':
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    case 'REFUND':
      return <RotateCcw className="w-4 h-4 text-blue-500" />;
    default:
      return <Coins className="w-4 h-4" />;
  }
};

const PointHistoryPage: React.FC = () => {
  const [pointHistory, setPointHistory] = useState<PointHistory[]>([]);
  const [summary, setSummary] = useState<PointSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedSort, setSelectedSort] = useState<SortType[]>(['LATEST']);
  const [pageSize] = useState(20);
  const isMobile = useIsMobile();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [historyResponse, summaryResponse] = await Promise.all([
        pointHistoryApi.getPointHistory({
          page: currentPage,
          size: pageSize,
          type: selectedType === 'ALL' ? undefined : selectedType,
          sort: selectedSort
        }),
        pointHistoryApi.getPointSummary()
      ]);

      setPointHistory(historyResponse.content || []);
      setTotalPages(historyResponse.totalPages || 0);
      setSummary(summaryResponse);
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error('Error fetching point history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, selectedType, selectedSort]);

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setCurrentPage(0);
  };

  const handleSortChange = (sortValue: string) => {
    const sortType = sortValue as SortType;
    setSelectedSort([sortType]);
    setCurrentPage(0);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  if (loading && currentPage === 0) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold">포인트 내역</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <Select value={selectedType} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="전체 유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체 유형</SelectItem>
              {Object.entries(transactionTypeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSort[0]} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchData} size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">현재 보유</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {summary.currentBalance.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">총 획득</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summary.totalEarned.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">총 사용</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summary.totalSpent.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">받은 선물</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {summary.totalReceived.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">보낸 선물</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {summary.totalGifted.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Point History Table/Cards */}
      <Card>
        <CardHeader>
          <CardTitle>포인트 내역</CardTitle>
        </CardHeader>
        <CardContent>
          {pointHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              포인트 내역이 없습니다.
            </div>
          ) : isMobile ? (
            // Mobile view - Card layout
            <div className="space-y-4">
              {pointHistory.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(item.type)}
                      <Badge variant="outline">
                        {transactionTypeLabels[item.type]}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        ['CHARGE', 'DAILY', 'COUPON', 'RECEIVE', 'REFUND'].includes(item.type)
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {['CHARGE', 'DAILY', 'COUPON', 'RECEIVE', 'REFUND'].includes(item.type) ? '+' : '-'}
                        {item.amount.toLocaleString()}P
                      </div>
                      <div className="text-sm text-muted-foreground">
                        잔액: {item.balanceAfter.toLocaleString()}P
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">
                    <UTCToKST date={item.usedAt} />
                  </div>
                  {item.memo && (
                    <div className="text-sm">{item.memo}</div>
                  )}
                  {item.relatedNickname && (
                    <div className="text-sm text-blue-600">
                      관련 사용자: {item.relatedNickname}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            // Desktop view - Table layout
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        날짜
                        {selectedSort.includes('LATEST') && <ArrowDown className="w-3 h-3" />}
                        {selectedSort.includes('OLDEST') && <ArrowUp className="w-3 h-3" />}
                      </div>
                    </TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>상세내용</TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        금액
                        {selectedSort.includes('AMOUNT_DESC') && <ArrowDown className="w-3 h-3" />}
                        {selectedSort.includes('AMOUNT_ASC') && <ArrowUp className="w-3 h-3" />}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        잔액
                        {selectedSort.includes('BALANCE_DESC') && <ArrowDown className="w-3 h-3" />}
                        {selectedSort.includes('BALANCE_ASC') && <ArrowUp className="w-3 h-3" />}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pointHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <UTCToKST date={item.usedAt} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(item.type)}
                          <Badge variant="outline">
                            {transactionTypeLabels[item.type]}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {item.memo}
                          {item.relatedNickname && (
                            <div className="text-sm text-blue-600 mt-1">
                              관련 사용자: {item.relatedNickname}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-bold ${
                          ['CHARGE', 'DAILY', 'COUPON', 'RECEIVE', 'REFUND'].includes(item.type)
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {['CHARGE', 'DAILY', 'COUPON', 'RECEIVE', 'REFUND'].includes(item.type) ? '+' : '-'}
                          {item.amount.toLocaleString()}P
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.balanceAfter.toLocaleString()}P
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm px-4">
                {currentPage + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PointHistoryPage;
