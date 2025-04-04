import { supabase } from './supabase';

export const uploadImage = async (file: File) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const deleteImage = async (path: string) => {
  try {
    const { error } = await supabase.storage
      .from('images')
      .remove([path]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};
