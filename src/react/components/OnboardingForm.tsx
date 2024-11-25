import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { User, UserDetails } from '../../types';
import {
  Card,
  Input,
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from './ui';

interface OnboardingFormProps {
  walletAddress: string;
  onComplete: (user: User) => void;
  onBack: () => void;
  theme?: {
    primary: string;
    secondary: string;
  };
  customStyles?: {
    container?: string;
    card?: string;
    button?: string;
    input?: string;
    select?: string;
  };
}

type AccountType = 'individual' | 'company';

export function OnboardingForm({
  walletAddress,
  onComplete,
  onBack,
  theme = { primary: 'blue', secondary: 'teal' },
  customStyles = {}
}: OnboardingFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<AccountType>('individual');
  
  const [details, setDetails] = useState<UserDetails>({
    first_name: '',
    last_name: '',
    company_name: '',
    email: '',
    role: 'User'
  });

  const handleDetailsChange = <K extends keyof UserDetails>(
    key: K,
    value: UserDetails[K]
  ) => {
    setDetails(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const createResponse = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_id: walletAddress,
          ...details,
          first_name: accountType === 'individual' ? details.first_name : undefined,
          last_name: accountType === 'individual' ? details.last_name : undefined,
          company_name: accountType === 'company' ? details.company_name : undefined
        })
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create profile');
      }

      const data = await createResponse.json();
      onComplete(data.user);
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`w-full max-w-md p-6 backdrop-blur-lg bg-white/10 ${customStyles.card || ''}`}>
      <div className="absolute bottom-2 right-2 w-24 h-10 opacity-50">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" className="text-white">
          <path d="M20 15h160v50H20z" fill="none" stroke="currentColor" strokeWidth="2"/>
          <text x="100" y="45" textAnchor="middle" fill="currentColor" 
                className="text-sm font-bold">ZEROCAT</text>
        </svg>
      </div>

      <div className="text-center mb-6">
        <h1 className={`text-3xl font-bold bg-gradient-to-r from-${theme.primary}-400 to-${theme.secondary}-400 bg-clip-text text-transparent`}>
          Complete Your Profile
        </h1>
        <p className="text-white/70 mt-2">
          Choose how you want to be known
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/10 rounded-lg"
        >
          <p className="text-sm text-red-400 text-center">{error}</p>
        </motion.div>
      )}

      <Tabs defaultValue="individual" className="w-full" 
            onValueChange={(value: string) => setAccountType(value as AccountType)}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="individual">Individual</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TabsContent value="individual">
            <div className="space-y-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={details.first_name}
                  onChange={(e) => handleDetailsChange('first_name', e.target.value)}
                  className={`bg-white/5 border-white/10 text-white ${customStyles.input}`}
                  placeholder="Optional"
                />
              </div>

              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={details.last_name}
                  onChange={(e) => handleDetailsChange('last_name', e.target.value)}
                  className={`bg-white/5 border-white/10 text-white ${customStyles.input}`}
                  placeholder="Optional"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="company">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={details.company_name}
                onChange={(e) => handleDetailsChange('company_name', e.target.value)}
                className={`bg-white/5 border-white/10 text-white ${customStyles.input}`}
                placeholder="Optional"
              />
            </div>
          </TabsContent>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={details.email}
              onChange={(e) => handleDetailsChange('email', e.target.value)}
              className={`bg-white/5 border-white/10 text-white ${customStyles.input}`}
              placeholder="Optional"
            />
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              value={details.role}
              onValueChange={(value) => handleDetailsChange('role', value)}
            >
              <SelectTrigger className={`bg-white/5 border-white/10 text-white ${customStyles.select}`}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="User">User</SelectItem>
                <SelectItem value="Administrator">Administrator</SelectItem>
                <SelectItem value="Developer">Developer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              className="flex-1"
              disabled={loading}
            >
              Back
            </Button>
            <Button
              type="submit"
              className={`flex-1 ${customStyles.button}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                'Complete'
              )}
            </Button>
          </div>
        </form>
      </Tabs>
    </Card>
  );
}