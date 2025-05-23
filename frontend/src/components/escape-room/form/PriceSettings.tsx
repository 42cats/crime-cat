import React from 'react';
import { DollarSign, Minus, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PriceSettingsProps {
    price: number;
    onPriceChange: (price: number) => void;
    error?: string;
    disabled?: boolean;
}

const PriceSettings: React.FC<PriceSettingsProps> = ({
    price,
    onPriceChange,
    error,
    disabled = false
}) => {
    const handlePriceChange = (value: number) => {
        const newPrice = Math.max(0, Math.min(value, 100000));
        onPriceChange(newPrice);
    };

    const formatPrice = (amount: number): string => {
        return new Intl.NumberFormat('ko-KR').format(amount);
    };

    const quickPriceButtons = [0, 15000, 20000, 25000, 30000, 35000];

    const getPriceCategory = (amount: number): { label: string; color: string; description: string } => {
        if (amount === 0) {
            return { 
                label: '무료', 
                color: 'bg-green-100 text-green-800', 
                description: '무료로 체험할 수 있습니다' 
            };
        } else if (amount <= 20000) {
            return { 
                label: '저렴', 
                color: 'bg-blue-100 text-blue-800', 
                description: '부담 없는 가격대입니다' 
            };
        } else if (amount <= 30000) {
            return { 
                label: '보통', 
                color: 'bg-yellow-100 text-yellow-800', 
                description: '일반적인 가격대입니다' 
            };
        } else if (amount <= 40000) {
            return { 
                label: '비쌈', 
                color: 'bg-orange-100 text-orange-800', 
                description: '다소 높은 가격대입니다' 
            };
        } else {
            return { 
                label: '매우 비쌈', 
                color: 'bg-red-100 text-red-800', 
                description: '프리미엄 가격대입니다' 
            };
        }
    };

    const priceCategory = getPriceCategory(price);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-600" />
                <Label className="text-sm font-medium">가격</Label>
            </div>
            
            <p className="text-xs text-gray-500">
                1인당 플레이 비용을 설정하세요 (무료는 0원으로 설정)
            </p>

            {/* 가격 입력 컨트롤 */}
            <div className="flex items-center gap-3">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePriceChange(price - 1000)}
                    disabled={disabled || price <= 0}
                    className="h-8 w-8 p-0"
                >
                    <Minus className="w-3 h-3" />
                </Button>
                
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        value={price}
                        onChange={(e) => handlePriceChange(parseInt(e.target.value) || 0)}
                        min={0}
                        max={100000}
                        step={1000}
                        disabled={disabled}
                        className="w-24 h-8 text-center"
                    />
                    <span className="text-sm text-gray-500">원</span>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePriceChange(price + 1000)}
                    disabled={disabled || price >= 100000}
                    className="h-8 w-8 p-0"
                >
                    <Plus className="w-3 h-3" />
                </Button>
            </div>

            {/* 에러 메시지 */}
            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}

            {/* 빠른 선택 버튼들 */}
            <div className="space-y-2">
                <Label className="text-xs text-gray-500">빠른 선택:</Label>
                <div className="flex flex-wrap gap-2">
                    {quickPriceButtons.map((amount) => (
                        <Button
                            key={amount}
                            type="button"
                            variant={price === amount ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePriceChange(amount)}
                            disabled={disabled}
                            className="h-7 text-xs"
                        >
                            {amount === 0 ? '무료' : `${formatPrice(amount)}원`}
                        </Button>
                    ))}
                </div>
            </div>

            {/* 가격 설정 요약 */}
            <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                        1인당 가격: {price === 0 ? '무료' : `${formatPrice(price)}원`}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${priceCategory.color}`}>
                        {priceCategory.label}
                    </span>
                </div>
                <p className="text-xs text-gray-500">
                    {priceCategory.description}
                </p>
            </div>

            {/* 가격 설정 가이드 */}
            <div className="text-xs text-gray-400 space-y-1">
                <p><strong>일반적인 가격대:</strong></p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li>초급 테마: 15,000-20,000원</li>
                    <li>일반 테마: 20,000-30,000원</li>
                    <li>고급 테마: 30,000-40,000원</li>
                    <li>프리미엄 테마: 40,000원 이상</li>
                </ul>
            </div>
        </div>
    );
};

export default PriceSettings;