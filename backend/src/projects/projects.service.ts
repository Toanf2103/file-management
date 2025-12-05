import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument, ProjectMemberRole } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async create(createProjectDto: CreateProjectDto, userId: string): Promise<Project> {
    const project = new this.projectModel({
      ...createProjectDto,
      createdBy: new Types.ObjectId(userId),
      members: [{
        userId: new Types.ObjectId(userId),
        role: ProjectMemberRole.OWNER,
      }],
    });
    return project.save();
  }

  async findAll(userId: string, userRole: string): Promise<Project[]> {
    if (userRole === 'admin') {
      return this.projectModel.find().populate('createdBy', 'email fullName').exec();
    }
    return this.projectModel.find({
      'members.userId': new Types.ObjectId(userId),
    }).populate('createdBy', 'email fullName').exec();
  }

  async findOne(id: string, userId: string, userRole: string): Promise<Project> {
    const project = await this.projectModel
      .findById(id)
      .populate('createdBy', 'email fullName')
      .populate('members.userId', 'email fullName avatar')
      .exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (userRole !== 'admin' && !this.isProjectMember(project, userId)) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return project;
  }

  async addMember(projectId: string, addMemberDto: AddMemberDto, userId: string): Promise<Project> {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!this.isProjectOwner(project, userId)) {
      throw new ForbiddenException('Only project owner can add members');
    }

    const memberExists = project.members.some(
      m => m.userId.toString() === addMemberDto.userId
    );

    if (memberExists) {
      throw new ForbiddenException('User is already a member of this project');
    }

    project.members.push({
      userId: new Types.ObjectId(addMemberDto.userId),
      role: ProjectMemberRole.MEMBER,
    });

    return project.save();
  }

  async removeMember(projectId: string, memberId: string, userId: string): Promise<Project> {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!this.isProjectOwner(project, userId)) {
      throw new ForbiddenException('Only project owner can remove members');
    }

    project.members = project.members.filter(
      m => m.userId.toString() !== memberId
    );

    return project.save();
  }

  isProjectMember(project: Project, userId: string): boolean {
    return project.members.some(m => {
      // Handle both ObjectId and populated User object
      const memberUserId = typeof m.userId === 'object' && m.userId !== null && '_id' in m.userId
        ? m.userId._id.toString()
        : m.userId.toString();
      return memberUserId === userId;
    });
  }

  isProjectOwner(project: Project, userId: string): boolean {
    return project.members.some(m => {
      // Handle both ObjectId and populated User object
      const memberUserId = typeof m.userId === 'object' && m.userId !== null && '_id' in m.userId
        ? m.userId._id.toString()
        : m.userId.toString();
      return memberUserId === userId && m.role === ProjectMemberRole.OWNER;
    });
  }
}

