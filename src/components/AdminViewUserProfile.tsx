import React, { useState, useEffect } from 'react';
    import { useParams, useNavigate } from 'react-router-dom';
    import { ArrowLeft, User, Mail, Building2, MapPin, Globe, Briefcase, Shield, Star } from 'lucide-react';
    import { supabase } from '../lib/supabase';
    import { Role, SuperRole } from '../types/auth'; // Assuming types are defined here

    interface UserProfileData {
      id: string;
      email: string;
      name: string | null;
      role: Role;
      super_role: SuperRole | null;
      avatar_url: string | null;
      title: string | null;
      bio: string | null;
      company: string | null;
      location: string | null;
      website: string | null;
      created_at: string;
    }

    export const AdminViewUserProfile: React.FC = () => {
      const { userId } = useParams<{ userId: string }>();
      const navigate = useNavigate();
      const [profile, setProfile] = useState<UserProfileData | null>(null);
      const [isLoading, setIsLoading] = useState(true);
      const [error, setError] = useState('');

      useEffect(() => {
        if (userId) {
          fetchProfile();
        } else {
          setError('User ID not provided.');
          setIsLoading(false);
        }
      }, [userId]);

      const fetchProfile = async () => {
        setIsLoading(true);
        setError('');
        try {
          const { data, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (fetchError) {
            if (fetchError.code === 'PGRST116') { // Code for "Not Found"
              throw new Error('User not found.');
            }
            throw fetchError;
          }
          setProfile(data);
        } catch (err) {
          console.error('Error fetching profile:', err);
          setError(err instanceof Error ? err.message : 'Failed to load user profile.');
        } finally {
          setIsLoading(false);
        }
      };

      const InfoFieldReadOnly: React.FC<{
        icon: React.ReactNode;
        label: string;
        value: string | null | undefined;
      }> = ({ icon, label, value }) => (
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
              {icon}
            </div>
          </div>
          <div className="flex-1">
            <p className="block text-sm font-medium text-gray-500">
              {label}
            </p>
            <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
              {value || <span className="italic text-gray-400">Not specified</span>}
            </p>
          </div>
        </div>
      );

      if (isLoading) {
        return (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        );
      }

      if (error) {
        return (
          <div className="text-center py-10">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => navigate('/admin/users')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to User List
            </button>
          </div>
        );
      }

      if (!profile) {
        return <div className="text-center py-10">User not found.</div>;
      }

      const avatarUrl = profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || profile.email || 'U')}&background=random`;

      return (
        <div className="max-w-4xl mx-auto space-y-6">
          <button
            onClick={() => navigate(-1)} // Go back to the previous page
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>

          {/* Header Card */}
          <div className="bg-white shadow rounded-xl overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <div className="relative px-6 pb-6">
              <div className="flex items-end absolute -top-16 space-x-6">
                <img
                  src={avatarUrl}
                  alt={profile.name || profile.email}
                  className="h-32 w-32 rounded-xl bg-white border-4 border-white shadow-xl object-cover"
                />
              </div>
              {/* Profile Name, Title, and Roles Section */}
              <div className="mt-20 flex justify-between items-start">
                {/* Left side: Name and Title */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{profile.name || 'No Name Provided'}</h1>
                  {profile.title && (
                    <p className="text-gray-600 mt-1">{profile.title}</p>
                  )}
                </div>
                {/* Right side: Role Badges */}
                <div className="flex flex-col items-end space-y-2">
                   <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                     profile.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                   }`}>
                     <Shield className="h-3 w-3 mr-1" />
                     {profile.role}
                   </span>
                   {profile.super_role && (
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                       <Star className="h-3 w-3 mr-1" />
                       {profile.super_role}
                     </span>
                   )}
                 </div>
              </div>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-white shadow rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">User Details</h2>
            <div className="space-y-6">
              <InfoFieldReadOnly
                icon={<Mail className="h-5 w-5" />}
                label="Email"
                value={profile.email}
              />
              <InfoFieldReadOnly
                icon={<Briefcase className="h-5 w-5" />}
                label="Title"
                value={profile.title}
              />
              <InfoFieldReadOnly
                icon={<Building2 className="h-5 w-5" />}
                label="Company"
                value={profile.company}
              />
              <InfoFieldReadOnly
                icon={<MapPin className="h-5 w-5" />}
                label="Location"
                value={profile.location}
              />
              <InfoFieldReadOnly
                icon={<Globe className="h-5 w-5" />}
                label="Website"
                value={profile.website}
              />
              <InfoFieldReadOnly
                icon={<User className="h-5 w-5" />}
                label="Bio"
                value={profile.bio}
              />
              <div className="pt-6 border-t border-gray-200">
                 <p className="text-xs text-gray-500">
                   User since: {new Date(profile.created_at).toLocaleDateString()}
                 </p>
               </div>
            </div>
          </div>
        </div>
      );
    };
