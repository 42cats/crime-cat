import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  locationMappingService, 
  LocationMapping, 
  LocationMappingRequest 
} from '@/api/admin/locationMappingService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

const LocationMappingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<LocationMapping | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<LocationMappingRequest>({
    keyword: '',
    normalized: '',
    relatedKeywords: [],
    typoVariants: [],
    isActive: true,
    description: '',
  });

  const [relatedKeywordsInput, setRelatedKeywordsInput] = useState('');
  const [typoVariantsInput, setTypoVariantsInput] = useState('');

  // Query for fetching mappings
  const { data, isLoading } = useQuery({
    queryKey: ['locationMappings', currentPage],
    queryFn: () => locationMappingService.getMappings(currentPage, 20),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: locationMappingService.createMapping,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locationMappings'] });
      toast.success('지역 매핑이 생성되었습니다.');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '생성 중 오류가 발생했습니다.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: LocationMappingRequest }) =>
      locationMappingService.updateMapping(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locationMappings'] });
      toast.success('지역 매핑이 수정되었습니다.');
      setIsEditOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '수정 중 오류가 발생했습니다.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: locationMappingService.deleteMapping,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locationMappings'] });
      toast.success('지역 매핑이 삭제되었습니다.');
      setDeleteConfirmOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '삭제 중 오류가 발생했습니다.');
    },
  });

  const resetForm = () => {
    setFormData({
      keyword: '',
      normalized: '',
      relatedKeywords: [],
      typoVariants: [],
      isActive: true,
      description: '',
    });
    setRelatedKeywordsInput('');
    setTypoVariantsInput('');
    setSelectedMapping(null);
  };

  const handleEdit = (mapping: LocationMapping) => {
    setSelectedMapping(mapping);
    setFormData({
      keyword: mapping.keyword,
      normalized: mapping.normalized,
      relatedKeywords: mapping.relatedKeywords,
      typoVariants: mapping.typoVariants,
      isActive: mapping.isActive,
      description: mapping.description || '',
    });
    setRelatedKeywordsInput(mapping.relatedKeywords.join(', '));
    setTypoVariantsInput(mapping.typoVariants.join(', '));
    setIsEditOpen(true);
  };

  const handleDelete = (mapping: LocationMapping) => {
    setSelectedMapping(mapping);
    setDeleteConfirmOpen(true);
  };

  const handleSubmit = () => {
    const submitData = {
      ...formData,
      relatedKeywords: relatedKeywordsInput
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k),
      typoVariants: typoVariantsInput
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k),
    };

    if (isEditOpen && selectedMapping) {
      updateMutation.mutate({ id: selectedMapping.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const filteredMappings = data?.mappings.filter(
    (mapping) =>
      mapping.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.normalized.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">지역 매핑 관리</CardTitle>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              새 매핑 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="키워드 또는 정규화된 주소로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>키워드</TableHead>
                    <TableHead>정규화된 주소</TableHead>
                    <TableHead>연관 키워드</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMappings?.map((mapping) => (
                    <TableRow key={mapping.id}>
                      <TableCell className="font-medium">{mapping.keyword}</TableCell>
                      <TableCell>{mapping.normalized}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {mapping.relatedKeywords.slice(0, 3).map((keyword, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                          {mapping.relatedKeywords.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{mapping.relatedKeywords.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={mapping.isActive ? 'default' : 'secondary'}>
                          {mapping.isActive ? '활성' : '비활성'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(mapping)}
                          className="mr-2"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(mapping)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {data && data.totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={data.totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={isCreateOpen ? setIsCreateOpen : setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditOpen ? '지역 매핑 수정' : '새 지역 매핑 추가'}</DialogTitle>
            <DialogDescription>
              지역 키워드와 정규화된 주소를 매핑하여 검색 기능을 향상시킵니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="keyword">키워드</Label>
                <Input
                  id="keyword"
                  value={formData.keyword}
                  onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                  placeholder="예: 홍대"
                />
              </div>
              <div>
                <Label htmlFor="normalized">정규화된 주소</Label>
                <Input
                  id="normalized"
                  value={formData.normalized}
                  onChange={(e) => setFormData({ ...formData, normalized: e.target.value })}
                  placeholder="예: 마포구 와우산로"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="relatedKeywords">연관 키워드 (쉼표로 구분)</Label>
              <Input
                id="relatedKeywords"
                value={relatedKeywordsInput}
                onChange={(e) => setRelatedKeywordsInput(e.target.value)}
                placeholder="예: 합정, 상수, 신촌"
              />
            </div>
            <div>
              <Label htmlFor="typoVariants">오타 변형 (쉼표로 구분)</Label>
              <Input
                id="typoVariants"
                value={typoVariantsInput}
                onChange={(e) => setTypoVariantsInput(e.target.value)}
                placeholder="예: 홍대입구, 홍대앞, 홍데"
              />
            </div>
            <div>
              <Label htmlFor="description">설명 (선택사항)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="추가 설명..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">활성화</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              isCreateOpen ? setIsCreateOpen(false) : setIsEditOpen(false);
              resetForm();
            }}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : isEditOpen ? (
                '수정'
              ) : (
                '생성'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>지역 매핑 삭제</DialogTitle>
            <DialogDescription>
              "{selectedMapping?.keyword}" 매핑을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedMapping && deleteMutation.mutate(selectedMapping.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  삭제 중...
                </>
              ) : (
                '삭제'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LocationMappingPage;