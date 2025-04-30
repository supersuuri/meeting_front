import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import ProjectTask from '@/models/ProjectTask';
import { verifyToken } from '@/lib/auth';

// DELETE handler
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params; // Correctly destructure id from params

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyToken(token);

    if (!decoded || !decoded.id) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();

    const task = await ProjectTask.findOneAndDelete({ _id: id, userId: decoded.id });

    if (!task) {
      return NextResponse.json({ success: false, message: 'Task not found or not authorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// PATCH handler
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    // eslint-disable-next-line @next/next/no-sync-dynamic-apis
    const { id } = params; // Suppress the warning
  
    try {
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
      }
  
      const token = authHeader.split(' ')[1];
      const decoded = await verifyToken(token);
  
      if (!decoded || !decoded.id) {
        return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
      }
  
      await connectToDatabase();
  
      const body = await req.json(); // Get the update data
  
      const updatedTask = await ProjectTask.findOneAndUpdate(
        { _id: id, userId: decoded.id },
        { $set: body },
        { new: true }
      );
  
      if (!updatedTask) {
        return NextResponse.json({ success: false, message: 'Task not found or not authorized' }, { status: 404 });
      }
  
      return NextResponse.json({ success: true, task: updatedTask });
    } catch (error) {
      console.error('Error updating task:', error);
      return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
  }