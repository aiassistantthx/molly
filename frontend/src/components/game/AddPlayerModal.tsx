import { useState } from 'react';
import { Modal, Input, Button } from '../ui';
import { AddPlayerData } from '../../api/games';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: AddPlayerData) => void;
}

export const AddPlayerModal = ({ isOpen, onClose, onAdd }: AddPlayerModalProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() && !email.trim()) return;

    setLoading(true);
    try {
      await onAdd({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
      });
      setName('');
      setEmail('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Player">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name / Nickname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
        />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gold/20" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-dark-card px-3 text-gray">or</span>
          </div>
        </div>
        <Input
          type="email"
          label="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="player@email.com"
        />
        <p className="text-xs text-gray">
          Enter a name to add a new player, or an email to find an existing user.
        </p>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            className="flex-1"
            disabled={!name.trim() && !email.trim()}
          >
            Add Player
          </Button>
        </div>
      </form>
    </Modal>
  );
};
