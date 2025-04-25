
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';

interface ThemePasswordDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  title: string;
  description: string;
  correctPassword: string;
  onSuccess: () => void;
}

const ThemePasswordDialog: React.FC<ThemePasswordDialogProps> = ({
  isOpen,
  setIsOpen,
  title,
  description,
  correctPassword,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [isError, setIsError] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === correctPassword) {
      setIsError(false);
      setPassword('');
      setIsOpen(false);
      onSuccess();
    } else {
      setIsError(true);
      toast({
        title: "Incorrect password",
        description: "The password you entered is incorrect. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={isError ? "border-destructive" : ""}
              />
              {isError && (
                <p className="text-xs text-destructive">Incorrect password. Please try again.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Continue</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ThemePasswordDialog;
