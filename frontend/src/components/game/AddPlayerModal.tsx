import { useState } from 'react';
import { Modal, Input, Button } from '../ui';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (email: string) => void;
}

export const AddPlayerModal = ({ isOpen, onClose, onAdd }: AddPlayerModalProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await onAdd(email.trim());
      setEmail('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Player">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          label="Player Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="player@email.com"
          required
        />
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Add Player
          </Button>
        </div>
      </form>
    </Modal>
  );
};
